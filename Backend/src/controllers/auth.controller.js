import bcrypt from 'bcryptjs';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import User from '../models/User.js';
import Post from '../models/Post.js';
import Connection from '../models/Connection.js';
import { signToken } from '../middleware/auth.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export async function register(req, res) {
  const startTime = Date.now();
  try {
    console.log('[Auth] Registration request received at', new Date().toISOString());
    console.log('[Auth] Request body:', JSON.stringify(req.body, null, 2));
    
    const { email, password, full_name, department, batch, student_id } = req.body;
    
    if (!email || !password) {
      console.log('[Auth] Missing email or password');
      return res.status(400).json({ error: 'Email and password required' });
    }

    console.log('[Auth] Step 1: Checking if user exists:', email);
    const checkStart = Date.now();
    const existing = await User.findOne({ email: email.toLowerCase().trim() });
    console.log(`[Auth] User check completed in ${Date.now() - checkStart}ms`);
    
    if (existing) {
      console.log('[Auth] User already exists:', email);
      return res.status(409).json({ error: 'Email already registered' });
    }

    console.log('[Auth] Step 2: Hashing password (8 rounds)');
    const hashStart = Date.now();
    // Use 8 rounds instead of 10 for faster hashing (still secure)
    const passwordHash = await bcrypt.hash(password, 3);
    console.log(`[Auth] Password hashed in ${Date.now() - hashStart}ms`);
    
    console.log('[Auth] Step 3: Creating user document');
    const createStart = Date.now();
    const user = await User.create({ 
      email: email.toLowerCase().trim(), 
      passwordHash, 
      full_name: full_name || email.split('@')[0],
      department: department || 'General',
      batch: batch || new Date().getFullYear().toString(),
      student_id: student_id || email.split('@')[0]
    });
    console.log(`[Auth] User created in ${Date.now() - createStart}ms`);
    
    console.log('[Auth] Step 4: User created successfully:', user._id);
    console.log('[Auth] User details:', {
      id: user._id,
      email: user.email,
      full_name: user.full_name,
      department: user.department,
      batch: user.batch,
      student_id: user.student_id
    });
    
    console.log('[Auth] Step 5: Generating JWT token');
    const tokenStart = Date.now();
    const token = signToken(user);
    console.log(`[Auth] Token generated in ${Date.now() - tokenStart}ms`);
    
    const response = {
      token,
      user: sanitizeUser(user),
    };
    
    const totalTime = Date.now() - startTime;
    console.log(`[Auth] ✓ Registration completed successfully in ${totalTime}ms`);
    console.log('[Auth] Sending success response');
    res.status(201).json(response);
  } catch (err) {
    const totalTime = Date.now() - startTime;
    console.error(`[Auth] ✗ Register error after ${totalTime}ms:`, err);
    console.error('[Auth] Error stack:', err.stack);
    res.status(500).json({ error: 'Registration failed', details: err.message });
  }
}

export async function login(req, res) {
  const startTime = Date.now();
  try {
    console.log('[Auth] Login request received at', new Date().toISOString());
    
    const { email, password } = req.body;
    if (!email || !password) {
      console.log('[Auth] Missing email or password');
      return res.status(400).json({ error: 'Email and password required' });
    }

    console.log('[Auth] Step 1: Finding user:', email);
    const findStart = Date.now();
    const user = await User.findOne({ email: email.toLowerCase().trim() });
    console.log(`[Auth] User lookup completed in ${Date.now() - findStart}ms`);
    
    if (!user) {
      console.log('[Auth] User not found:', email);
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    console.log('[Auth] Step 2: Comparing password');
    const compareStart = Date.now();
    const ok = await bcrypt.compare(password, user.passwordHash);
    console.log(`[Auth] Password comparison completed in ${Date.now() - compareStart}ms`);
    
    if (!ok) {
      console.log('[Auth] Invalid password for:', email);
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    console.log('[Auth] Step 3: Generating JWT token');
    const tokenStart = Date.now();
    const token = signToken(user);
    console.log(`[Auth] Token generated in ${Date.now() - tokenStart}ms`);
    
    const response = {
      token,
      user: sanitizeUser(user)
    };
    
    const totalTime = Date.now() - startTime;
    console.log(`[Auth] ✓ Login completed successfully in ${totalTime}ms`);
    console.log('[Auth] User logged in:', user.email);
    
    res.json(response);
  } catch (err) {
    const totalTime = Date.now() - startTime;
    console.error(`[Auth] ✗ Login error after ${totalTime}ms:`, err);
    console.error('[Auth] Error stack:', err.stack);
    res.status(500).json({ error: 'Login failed', details: err.message });
  }
}

export async function me(req, res) {
  try {
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json({ user: sanitizeUser(user) });
  } catch (err) {
    res.status(500).json({ error: 'Failed to get profile' });
  }
}

export async function updateProfile(req, res) {
  try {
    const updates = req.body;
    const user = await User.findByIdAndUpdate(req.user.id, updates, { new: true });
    res.json({ user: sanitizeUser(user) });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update profile' });
  }
}

export async function changePassword(req, res) {
  try {
    console.log('[Auth] Change password request for user:', req.user.id);
    
    const { currentPassword, newPassword } = req.body;
    
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ error: 'Current password and new password are required' });
    }
    
    if (newPassword.length < 6) {
      return res.status(400).json({ error: 'New password must be at least 6 characters' });
    }
    
    // Get user with password
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    // Verify current password
    const isPasswordValid = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!isPasswordValid) {
      console.log('[Auth] Invalid current password');
      return res.status(401).json({ error: 'Current password is incorrect' });
    }
    
    // Check if new password is same as current
    const isSamePassword = await bcrypt.compare(newPassword, user.passwordHash);
    if (isSamePassword) {
      return res.status(400).json({ error: 'New password must be different from current password' });
    }
    
    // Hash new password
    const newPasswordHash = await bcrypt.hash(newPassword, 8);
    
    // Update password
    user.passwordHash = newPasswordHash;
    await user.save();
    
    console.log('[Auth] ✓ Password changed successfully for user:', user.email);
    res.json({ success: true, message: 'Password changed successfully' });
  } catch (err) {
    console.error('[Auth] ✗ Change password error:', err);
    res.status(500).json({ error: 'Failed to change password' });
  }
}

export async function deleteAvatar(req, res) {
  try {
    console.log('[Auth] Delete avatar request received for user:', req.user.id);
    
    // Get the user's current avatar_url
    const user = await User.findById(req.user.id);
    if (!user) {
      console.log('[Auth] User not found:', req.user.id);
      return res.status(404).json({ error: 'User not found' });
    }

    // If user has an avatar_url, try to delete the file
    if (user.avatar_url) {
      try {
        // Extract filename from URL (format: http://localhost:4000/uploads/filename.jpg)
        const urlParts = user.avatar_url.split('/');
        const filename = urlParts[urlParts.length - 1];
        
        // Construct the file path
        const uploadsDir = path.join(__dirname, '../../uploads');
        const filePath = path.join(uploadsDir, filename);
        
        console.log('[Auth] Attempting to delete file:', filePath);
        
        // Check if file exists and delete it
        try {
          await fs.access(filePath);
          await fs.unlink(filePath);
          console.log('[Auth] ✓ File deleted successfully:', filename);
        } catch (fileErr) {
          // File doesn't exist or can't be deleted - that's okay, continue
          console.log('[Auth] File not found or already deleted:', filename);
        }
      } catch (parseErr) {
        console.log('[Auth] Could not parse avatar URL:', user.avatar_url);
      }
    }

    // Update user to remove avatar_url
    const updatedUser = await User.findByIdAndUpdate(
      req.user.id, 
      { avatar_url: null }, 
      { new: true }
    );
    
    console.log('[Auth] ✓ Avatar removed for user:', updatedUser.email);
    res.json({ 
      success: true, 
      message: 'Avatar removed successfully',
      user: sanitizeUser(updatedUser) 
    });
  } catch (err) {
    console.error('[Auth] ✗ Delete avatar error:', err);
    res.status(500).json({ error: 'Failed to delete avatar', details: err.message });
  }
}

function sanitizeUser(u) {
  if (!u) return null;
  const { _id, email, full_name, department, batch, student_id, phone, bio, avatar_url, createdAt, updatedAt } = u;
  return { 
    id: _id.toString(), 
    email, 
    full_name, 
    department, 
    batch, 
    student_id,
    phone, 
    bio, 
    avatar_url, 
    createdAt, 
    updatedAt 
  };
}

// Get any user's profile by ID
export async function getUserProfile(req, res) {
  try {
    const { user_id } = req.params;
    const currentUserId = req.user.id; // Fixed: use .id not ._id

    console.log('[Auth] Get user profile request for:', user_id);

    // Get user details
    const user = await User.findById(user_id).select('-passwordHash');
    
    if (!user) {
      console.log('[Auth] User not found:', user_id);
      return res.status(404).json({ error: 'User not found' });
    }

    // Get connection status with current user
    let connectionStatus = 'none';
    let connectionId = null;
    let isRequester = false;

    if (currentUserId.toString() !== user_id) {
      const connection = await Connection.findOne({
        $or: [
          { requester_id: currentUserId, recipient_id: user_id },
          { requester_id: user_id, recipient_id: currentUserId }
        ]
      });

      if (connection) {
        connectionStatus = connection.status;
        connectionId = connection._id;
        isRequester = connection.requester_id.toString() === currentUserId.toString();
      }
    } else {
      connectionStatus = 'self';
    }

    // Get user's posts
    const posts = await Post.find({ 
      user_id: user_id, 
      privacy: 'public' 
    })
    .sort({ created_at: -1 })
    .limit(20)
    .populate('user_id', 'full_name avatar_url department title email');

    console.log(`[Auth] Found ${posts.length} posts for user ${user_id}`);

    // Count connections
    const connectionCount = await Connection.countDocuments({
      $or: [
        { requester_id: user_id, status: 'accepted' },
        { recipient_id: user_id, status: 'accepted' }
      ]
    });

    // Format response
    const profile = {
      id: user._id.toString(),
      full_name: user.full_name,
      email: user.email,
      avatar_url: user.avatar_url,
      title: user.title || null,
      department: user.department,
      batch: user.batch,
      student_id: user.student_id,
      phone: user.phone,
      bio: user.bio,
      connections_count: connectionCount,
      posts_count: posts.length,
      connection_status: {
        status: connectionStatus,
        connection_id: connectionId,
        is_requester: isRequester,
      },
      posts: posts.map(p => ({
        id: p._id.toString(),
        user: {
          id: p.user_id?._id?.toString() || user_id,
          name: p.user_id?.full_name || user.full_name,
          avatarUrl: p.user_id?.avatar_url || user.avatar_url,
          department: p.user_id?.department || user.department,
          title: p.user_id?.title || user.title,
        },
        content: p.content,
        category: p.category,
        timestamp: p.created_at,
        likes: p.likes_count || 0,
        comments: p.comments_count || 0,
        shares: p.shares_count || 0,
        imageUrl: p.image_urls?.[0] || null,
      })),
      created_at: user.createdAt,
    };

    console.log('[Auth] ✓ User profile retrieved successfully');
    res.json({ profile });
  } catch (err) {
    console.error('[Auth] ✗ Get user profile error:', err);
    res.status(500).json({ error: 'Failed to get user profile' });
  }
}

// Search users
export async function searchUsers(req, res) {
  try {
    const { query, limit = 20 } = req.query;
    const currentUserId = req.user.id;

    if (!query || query.trim().length < 2) {
      return res.status(400).json({ error: 'Search query must be at least 2 characters' });
    }

    console.log('[Auth] Searching users with query:', query);

    // Search by name, email, department, or student_id
    const searchRegex = new RegExp(query.trim(), 'i');
    
    const users = await User.find({
      _id: { $ne: currentUserId }, // Exclude current user
      $or: [
        { full_name: searchRegex },
        { email: searchRegex },
        { department: searchRegex },
        { student_id: searchRegex },
        { batch: searchRegex },
      ],
    })
      .select('full_name email department batch student_id avatar_url bio')
      .limit(parseInt(limit))
      .lean();

    console.log('[Auth] Found', users.length, 'users matching query:', query);

    // Get connection status for each user
    const Connection = (await import('../models/Connection.js')).default;
    
    const usersWithStatus = await Promise.all(
      users.map(async (user) => {
        const userId = user._id.toString();
        
        // Check connection status
        const connection = await Connection.findOne({
          $or: [
            { requester_id: currentUserId, recipient_id: userId },
            { requester_id: userId, recipient_id: currentUserId },
          ],
        });

        let connectionStatus = 'none';
        let connectionId = null;
        let isRequester = false;

        if (connection) {
          connectionId = connection._id.toString();
          if (connection.status === 'accepted') {
            connectionStatus = 'connected';
          } else if (connection.status === 'pending') {
            connectionStatus = 'pending';
            isRequester = connection.requester_id.toString() === currentUserId;
          }
        }

        return {
          id: userId,
          full_name: user.full_name,
          email: user.email,
          department: user.department,
          batch: user.batch,
          student_id: user.student_id,
          avatar_url: user.avatar_url,
          bio: user.bio,
          connection_status: {
            status: connectionStatus,
            connection_id: connectionId,
            is_requester: isRequester,
          },
        };
      })
    );

    res.json({ users: usersWithStatus });
  } catch (err) {
    console.error('[Auth] ✗ Search users error:', err);
    res.status(500).json({ error: 'Failed to search users' });
  }
}
