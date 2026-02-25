import express from 'express';
import * as messagesController from '../controllers/messages.controller.js';
import { authRequired } from '../middleware/auth.js';

const router = express.Router();

// All routes require authentication
router.use(authRequired);

// Send a message
router.post('/send', messagesController.sendMessage);

// Get conversation with a specific user
router.get('/conversation/:other_user_id', messagesController.getConversation);

// Get all conversations
router.get('/conversations', messagesController.getConversations);

// Mark messages as read
router.post('/mark-read', messagesController.markAsRead);

// Get unread message count
router.get('/unread-count', messagesController.getUnreadCount);

// Delete a message
router.delete('/:message_id', messagesController.deleteMessage);

export default router;
