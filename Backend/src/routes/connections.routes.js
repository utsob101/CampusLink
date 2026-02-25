import express from 'express';
import { authRequired } from '../middleware/auth.js';
import {
  sendConnectionRequest,
  acceptConnectionRequest,
  rejectConnectionRequest,
  getConnections,
  getPendingRequests,
  getConnectionStatus,
  removeConnection,
} from '../controllers/connections.controller.js';

const router = express.Router();

// All routes require authentication
router.use(authRequired);

// Send connection request
router.post('/send', sendConnectionRequest);

// Accept connection request
router.post('/accept', acceptConnectionRequest);

// Reject connection request
router.post('/reject', rejectConnectionRequest);

// Remove connection
router.post('/remove', removeConnection);

// Get all connections
router.get('/', getConnections);

// Get pending requests
router.get('/pending', getPendingRequests);

// Get connection status with another user
router.get('/status/:other_user_id', getConnectionStatus);

export default router;
