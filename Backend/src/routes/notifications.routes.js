import express from 'express';
import { authRequired } from '../middleware/auth.js';
import {
  getNotifications,
  getUnreadCount,
  markAsRead,
  markAllAsRead,
  deleteNotification
} from '../controllers/notifications.controller.js';

const router = express.Router();

// All routes require authentication
router.use(authRequired);

// Get all notifications for current user
router.get('/', getNotifications);

// Get unread notification count
router.get('/unread-count', getUnreadCount);

// Mark notification as read
router.post('/:notification_id/read', markAsRead);

// Mark all notifications as read
router.post('/mark-all-read', markAllAsRead);

// Delete notification
router.delete('/:notification_id', deleteNotification);

export default router;
