import Message from '../models/Message.js';
import User from '../models/User.js';
import { createNotification } from './notifications.controller.js';
import Connection from '../models/Connection.js';
import mongoose from 'mongoose';

// Send a message
export const sendMessage = async (req, res) => {
  try {
    const senderId = req.user.id;
    const { receiver_id, content } = req.body;

    if (!receiver_id || !content) {
      return res.status(400).json({ 
        error: 'Receiver ID and message content are required' 
      });
    }

    if (!content.trim()) {
      return res.status(400).json({ 
        error: 'Message content cannot be empty' 
      });
    }

    // Check if receiver exists
    const receiver = await User.findById(receiver_id);
    if (!receiver) {
      return res.status(404).json({ error: 'Receiver not found' });
    }

    // Allow messaging to anyone (removed connection check)
    // Users can message anyone on the platform

    // Create message
    const message = new Message({
      sender: senderId,
      receiver: receiver_id,
      content: content.trim()
    });

    await message.save();

    // Populate sender info for response
    await message.populate('sender', 'full_name email avatar_url');

    // Create notification for receiver
    await createNotification(
      receiver_id,
      senderId,
      'message',
      'sent you a message',
      message._id,
      'Message'
    );

    console.log('[Messages] Message sent:', message._id);

    res.status(201).json({
      message: {
        id: message._id,
        sender_id: message.sender._id,
        sender_name: message.sender.full_name,
        sender_avatar: message.sender.avatar_url,
        receiver_id: message.receiver,
        content: message.content,
        read: message.read,
        created_at: message.createdAt,
        updated_at: message.updatedAt
      }
    });
  } catch (error) {
    console.error('[Messages] Send message error:', error);
    res.status(500).json({ error: 'Failed to send message' });
  }
};

// Get conversation with a specific user
export const getConversation = async (req, res) => {
  try {
    const currentUserId = req.user.id;
    const { other_user_id } = req.params;

    if (!other_user_id) {
      return res.status(400).json({ error: 'Other user ID is required' });
    }

    // Check if other user exists
    const otherUser = await User.findById(other_user_id);
    if (!otherUser) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Get all messages between these two users
    const messages = await Message.find({
      $or: [
        { sender: currentUserId, receiver: other_user_id },
        { sender: other_user_id, receiver: currentUserId }
      ]
    })
    .populate('sender', 'full_name email avatar_url')
    .populate('receiver', 'full_name email avatar_url')
    .sort({ createdAt: 1 }); // Oldest first

    // Mark messages from other user as read
    await Message.updateMany(
      { 
        sender: other_user_id, 
        receiver: currentUserId,
        read: false
      },
      { 
        read: true,
        read_at: new Date()
      }
    );

    console.log('[Messages] Retrieved conversation:', messages.length, 'messages');

    const formattedMessages = messages.map(msg => ({
      id: msg._id,
      sender_id: msg.sender._id,
      sender_name: msg.sender.full_name,
      sender_avatar: msg.sender.avatar_url,
      receiver_id: msg.receiver._id,
      receiver_name: msg.receiver.full_name,
      content: msg.content,
      read: msg.read,
      read_at: msg.read_at,
      created_at: msg.createdAt,
      is_own: msg.sender._id.toString() === currentUserId
    }));

    res.json({
      messages: formattedMessages,
      other_user: {
        id: otherUser._id,
        full_name: otherUser.full_name,
        email: otherUser.email,
        avatar_url: otherUser.avatar_url,
        department: otherUser.department,
        batch: otherUser.batch
      }
    });
  } catch (error) {
    console.error('[Messages] Get conversation error:', error);
    res.status(500).json({ error: 'Failed to retrieve conversation' });
  }
};

// Get all conversations (list of users you've chatted with)
export const getConversations = async (req, res) => {
  try {
    const currentUserId = req.user.id;

    // Get all messages where user is sender or receiver
    const messages = await Message.find({
      $or: [
        { sender: currentUserId },
        { receiver: currentUserId }
      ]
    })
    .populate('sender', 'full_name email avatar_url')
    .populate('receiver', 'full_name email avatar_url')
    .sort({ createdAt: -1 });

    // Group by conversation partner
    const conversationsMap = new Map();

    for (const msg of messages) {
      const isSender = msg.sender._id.toString() === currentUserId;
      const otherUser = isSender ? msg.receiver : msg.sender;
      const otherUserId = otherUser._id.toString();

      if (!conversationsMap.has(otherUserId)) {
        // Count unread messages from this user
        const unreadCount = await Message.countDocuments({
          sender: otherUserId,
          receiver: currentUserId,
          read: false
        });

        conversationsMap.set(otherUserId, {
          user: {
            id: otherUser._id,
            full_name: otherUser.full_name,
            email: otherUser.email,
            avatar_url: otherUser.avatar_url
          },
          last_message: {
            content: msg.content,
            created_at: msg.createdAt,
            is_own: isSender,
            read: msg.read
          },
          unread_count: unreadCount
        });
      }
    }

    const conversations = Array.from(conversationsMap.values());

    console.log('[Messages] Retrieved conversations:', conversations.length);

    res.json({ conversations });
  } catch (error) {
    console.error('[Messages] Get conversations error:', error);
    res.status(500).json({ error: 'Failed to retrieve conversations' });
  }
};

// Mark messages as read
export const markAsRead = async (req, res) => {
  try {
    const currentUserId = req.user.id;
    const { sender_id } = req.body;

    if (!sender_id) {
      return res.status(400).json({ error: 'Sender ID is required' });
    }

    const result = await Message.updateMany(
      {
        sender: sender_id,
        receiver: currentUserId,
        read: false
      },
      {
        read: true,
        read_at: new Date()
      }
    );

    console.log('[Messages] Marked as read:', result.modifiedCount, 'messages');

    res.json({
      success: true,
      marked_count: result.modifiedCount
    });
  } catch (error) {
    console.error('[Messages] Mark as read error:', error);
    res.status(500).json({ error: 'Failed to mark messages as read' });
  }
};

// Get unread message count
export const getUnreadCount = async (req, res) => {
  try {
    const currentUserId = req.user.id;

    const unreadCount = await Message.countDocuments({
      receiver: currentUserId,
      read: false
    });

    console.log('[Messages] Unread count:', unreadCount);

    res.json({ unread_count: unreadCount });
  } catch (error) {
    console.error('[Messages] Get unread count error:', error);
    res.status(500).json({ error: 'Failed to get unread count' });
  }
};

// Delete a message (only sender can delete)
export const deleteMessage = async (req, res) => {
  try {
    const currentUserId = req.user.id;
    const { message_id } = req.params;

    const message = await Message.findById(message_id);
    
    if (!message) {
      return res.status(404).json({ error: 'Message not found' });
    }

    if (message.sender.toString() !== currentUserId) {
      return res.status(403).json({ error: 'You can only delete your own messages' });
    }

    await message.deleteOne();

    console.log('[Messages] Message deleted:', message_id);

    res.json({ success: true, message: 'Message deleted' });
  } catch (error) {
    console.error('[Messages] Delete message error:', error);
    res.status(500).json({ error: 'Failed to delete message' });
  }
};
