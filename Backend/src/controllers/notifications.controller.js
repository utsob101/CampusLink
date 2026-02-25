import Notification from '../models/Notification.js';
import User from '../models/User.js';

// Create a notification
export const createNotification = async (recipientId, senderId, type, message, referenceId = null, referenceModel = null) => {
  try {
    // Don't create notification if recipient is sender
    if (recipientId === senderId) {
      return null;
    }

    const notification = await Notification.create({
      recipient: recipientId,
      sender: senderId,
      type,
      message,
      reference_id: referenceId,
      reference_model: referenceModel
    });

    console.log('[Notifications] Created notification:', notification._id, 'type:', type);
    return notification;
  } catch (error) {
    console.error('[Notifications] Error creating notification:', error);
    return null;
  }
};

// Get all notifications for current user
export const getNotifications = async (req, res) => {
  try {
    const userId = req.user.id;

    const notifications = await Notification.find({ recipient: userId })
      .populate('sender', 'full_name email avatar_url')
      .sort({ createdAt: -1 })
      .limit(50);

    const formattedNotifications = notifications.map(notif => ({
      id: notif._id,
      type: notif.type,
      message: notif.message,
      read: notif.read,
      read_at: notif.read_at,
      created_at: notif.createdAt,
      sender: {
        id: notif.sender._id,
        full_name: notif.sender.full_name,
        email: notif.sender.email,
        avatar_url: notif.sender.avatar_url
      },
      reference_id: notif.reference_id,
      reference_model: notif.reference_model
    }));

    res.json({ notifications: formattedNotifications });
  } catch (error) {
    console.error('[Notifications] Get notifications error:', error);
    res.status(500).json({ error: 'Failed to retrieve notifications' });
  }
};

// Get unread notification count
export const getUnreadCount = async (req, res) => {
  try {
    const userId = req.user.id;

    const count = await Notification.countDocuments({
      recipient: userId,
      read: false
    });

    res.json({ unread_count: count });
  } catch (error) {
    console.error('[Notifications] Get unread count error:', error);
    res.status(500).json({ error: 'Failed to get unread count' });
  }
};

// Mark notification as read
export const markAsRead = async (req, res) => {
  try {
    const userId = req.user.id;
    const { notification_id } = req.params;

    const notification = await Notification.findOne({
      _id: notification_id,
      recipient: userId
    });

    if (!notification) {
      return res.status(404).json({ error: 'Notification not found' });
    }

    notification.read = true;
    notification.read_at = new Date();
    await notification.save();

    res.json({ message: 'Notification marked as read', notification });
  } catch (error) {
    console.error('[Notifications] Mark as read error:', error);
    res.status(500).json({ error: 'Failed to mark notification as read' });
  }
};

// Mark all notifications as read
export const markAllAsRead = async (req, res) => {
  try {
    const userId = req.user.id;

    await Notification.updateMany(
      { recipient: userId, read: false },
      { read: true, read_at: new Date() }
    );

    res.json({ message: 'All notifications marked as read' });
  } catch (error) {
    console.error('[Notifications] Mark all as read error:', error);
    res.status(500).json({ error: 'Failed to mark all notifications as read' });
  }
};

// Delete a notification
export const deleteNotification = async (req, res) => {
  try {
    const userId = req.user.id;
    const { notification_id } = req.params;

    const notification = await Notification.findOne({
      _id: notification_id,
      recipient: userId
    });

    if (!notification) {
      return res.status(404).json({ error: 'Notification not found' });
    }

    await notification.deleteOne();

    res.json({ message: 'Notification deleted' });
  } catch (error) {
    console.error('[Notifications] Delete notification error:', error);
    res.status(500).json({ error: 'Failed to delete notification' });
  }
};
