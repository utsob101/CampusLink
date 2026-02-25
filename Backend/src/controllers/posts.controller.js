import Post from '../models/Post.js';
import Like from '../models/Like.js';
import { createNotification } from './notifications.controller.js';

export async function createPost(req, res) {
  try {
    const data = req.body || {};
    console.log('[Posts] Creating post with data:', JSON.stringify(data, null, 2));
    const post = await Post.create({
      user_id: req.user.id,
      content: data.content || '',
      category: data.category || 'general',
      privacy: data.privacy || 'public',
      image_urls: data.image_urls || [],
      feeling: data.feeling,
      event_details: data.event_details,
      tags: data.tags || [],
    });
    console.log('[Posts] Post created with image_urls:', post.image_urls);
    res.status(201).json({ post });
  } catch (err) {
    console.error('Create post error:', err);
    res.status(500).json({ error: 'Failed to create post' });
  }
}

export async function getFeed(req, res) {
  try {
    const limit = Math.min(parseInt(req.query.limit || '50', 10), 100);
    const currentUserId = req.user.id; // Use .id not ._id
    
    console.log('[Feed] Fetching feed for user:', currentUserId);
    
    // Get all public posts (social media style - everyone can see everything)
    const posts = await Post.find({ privacy: 'public' })
      .sort({ created_at: -1 })
      .limit(limit)
      .populate('user_id', 'full_name avatar_url department title email')
      .populate({
        path: 'shared_post_id',
        populate: {
          path: 'user_id',
          select: 'full_name avatar_url department title email'
        }
      });

    console.log('[Feed] Found', posts.length, 'posts');

    // Check which posts current user has liked
    const postIds = posts.map(p => p._id);
    const userLikes = await Like.find({ 
      post_id: { $in: postIds }, 
      user_id: currentUserId 
    }).select('post_id');
    
    const likedPostIds = new Set(userLikes.map(like => like.post_id.toString()));

    const mapped = posts.map((p) => ({
      id: p._id.toString(),
      user: {
        id: p.user_id?._id?.toString() || null,
        name: p.user_id?.full_name || 'User',
        avatarUrl: p.user_id?.avatar_url || null,
        department: p.user_id?.department || 'Student',
        title: p.user_id?.title || null,
        email: p.user_id?.email || null,
      },
      content: p.content,
      category: p.category,
      timestamp: p.created_at,
      likes: p.likes_count || 0,
      comments: p.comments_count || 0,
      shares: p.shares_count || 0,
      imageUrl: p.image_urls?.[0] || null,
      isLiked: likedPostIds.has(p._id.toString()),
      sharedPost: p.shared_post_id ? {
        id: p.shared_post_id._id?.toString(),
        user: {
          id: p.shared_post_id.user_id?._id?.toString() || null,
          name: p.shared_post_id.user_id?.full_name || 'User',
          avatarUrl: p.shared_post_id.user_id?.avatar_url || null,
          department: p.shared_post_id.user_id?.department || 'Student',
        },
        content: p.shared_post_id.content,
        imageUrl: p.shared_post_id.image_urls?.[0] || null,
        timestamp: p.shared_post_id.created_at,
      } : null,
    }));

    console.log('[Feed] Mapped posts:', mapped.length);
    res.json({ posts: mapped });
  } catch (err) {
    console.error('[Feed] ❌ Feed error:', err);
    res.status(500).json({ error: 'Failed to load feed' });
  }
}

export async function likePost(req, res) {
  try {
    const { postId } = req.params;
    const userId = req.user.id;
    
    await Like.create({ post_id: postId, user_id: userId });
    const post = await Post.findByIdAndUpdate(postId, { $inc: { likes_count: 1 } }, { new: true });
    
    // Create notification for post author
    if (post && post.user_id.toString() !== userId) {
      await createNotification(
        post.user_id,
        userId,
        'like',
        'liked your post',
        postId,
        'Post'
      );
    }
    
    res.status(201).json({ ok: true });
  } catch (err) {
    if (err.code === 11000) return res.status(409).json({ error: 'Already liked' });
    console.error('Like error:', err);
    res.status(500).json({ error: 'Failed to like' });
  }
}

export async function unlikePost(req, res) {
  try {
    const { postId } = req.params;
    const del = await Like.findOneAndDelete({ post_id: postId, user_id: req.user.id });
    if (del) await Post.findByIdAndUpdate(postId, { $inc: { likes_count: -1 } });
    res.json({ ok: true });
  } catch (err) {
    console.error('Unlike error:', err);
    res.status(500).json({ error: 'Failed to unlike' });
  }
}

export async function sharePost(req, res) {
  try {
    const { postId } = req.params;
    const userId = req.user.id;
    
    // Find the original post
    const originalPost = await Post.findById(postId);
    if (!originalPost) {
      return res.status(404).json({ error: 'Post not found' });
    }
    
    // Create a new shared post
    const sharedPost = new Post({
      user_id: userId,
      content: req.body.content || '', // Optional comment when sharing
      shared_post_id: postId, // Reference to original post
      privacy: 'public',
      created_at: new Date()
    });
    
    await sharedPost.save();
    
    // Increment share count on original post
    await Post.findByIdAndUpdate(postId, { $inc: { shares_count: 1 } });
    
    console.log('[Posts] Post shared:', postId, 'by user:', userId);
    res.json({ ok: true, post: sharedPost });
  } catch (err) {
    console.error('Share error:', err);
    res.status(500).json({ error: 'Failed to share' });
  }
}

export async function deletePost(req, res) {
  try {
    const { postId } = req.params;
    const userId = req.user.id;
    
    // Find the post
    const post = await Post.findById(postId);
    
    if (!post) {
      return res.status(404).json({ error: 'Post not found' });
    }
    
    // Check if user is the owner
    if (post.user_id.toString() !== userId) {
      return res.status(403).json({ error: 'You can only delete your own posts' });
    }
    
    // Delete the post
    await Post.findByIdAndDelete(postId);
    
    // Delete associated likes
    await Like.deleteMany({ post_id: postId });
    
    // Note: Comments are in separate collection, could delete them too
    // await Comment.deleteMany({ post_id: postId });
    
    console.log('[Posts] Post deleted:', postId);
    res.json({ ok: true, message: 'Post deleted successfully' });
  } catch (err) {
    console.error('Delete post error:', err);
    res.status(500).json({ error: 'Failed to delete post' });
  }
}
