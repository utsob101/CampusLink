import Connection from '../models/Connection.js';
import User from '../models/User.js';
import { createNotification } from './notifications.controller.js';

// Send a connection request
export async function sendConnectionRequest(req, res) {
  try {
    const { recipient_id } = req.body;
    const requester_id = req.user.id; // Fixed: use .id not ._id

    console.log('📤 Sending connection request:', { requester_id, recipient_id });

    // Validation
    if (!recipient_id) {
      return res.status(400).json({ error: 'Recipient ID is required' });
    }

    // Can't connect with yourself
    if (requester_id.toString() === recipient_id) {
      return res.status(400).json({ error: 'Cannot send connection request to yourself' });
    }

    // Check if recipient exists
    const recipient = await User.findById(recipient_id);
    if (!recipient) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Check if connection already exists (in either direction)
    const existingConnection = await Connection.findOne({
      $or: [
        { requester_id, recipient_id },
        { requester_id: recipient_id, recipient_id: requester_id }
      ]
    });

    if (existingConnection) {
      if (existingConnection.status === 'pending') {
        return res.status(400).json({ error: 'Connection request already pending' });
      }
      if (existingConnection.status === 'accepted') {
        return res.status(400).json({ error: 'Already connected' });
      }
      // If rejected, allow new request
      existingConnection.status = 'pending';
      existingConnection.requester_id = requester_id;
      existingConnection.recipient_id = recipient_id;
      await existingConnection.save();
      
      console.log('✅ Connection request re-sent');
      return res.json({ success: true, connection: existingConnection });
    }

    // Create new connection request
    const connection = new Connection({
      requester_id,
      recipient_id,
      status: 'pending',
    });

    await connection.save();
    
    // Create notification for recipient
    await createNotification(
      recipient_id,
      requester_id,
      'connection_request',
      'sent you a connection request',
      connection._id,
      'Connection'
    );
    
    console.log('✅ Connection request sent successfully');
    res.json({ success: true, connection });
  } catch (error) {
    console.error('❌ Error sending connection request:', error);
    res.status(500).json({ error: 'Failed to send connection request' });
  }
}

// Accept a connection request
export async function acceptConnectionRequest(req, res) {
  try {
    const { connection_id } = req.body;
    const user_id = req.user.id; // Fixed: use .id not ._id

    console.log('✅ Accepting connection request:', { connection_id, user_id });

    const connection = await Connection.findById(connection_id);
    
    if (!connection) {
      return res.status(404).json({ error: 'Connection request not found' });
    }

    // Only recipient can accept
    if (connection.recipient_id.toString() !== user_id.toString()) {
      return res.status(403).json({ error: 'Not authorized to accept this request' });
    }

    if (connection.status !== 'pending') {
      return res.status(400).json({ error: 'Connection request is not pending' });
    }

    connection.status = 'accepted';
    await connection.save();

    // Create notification for requester
    await createNotification(
      connection.requester_id,
      user_id,
      'connection_accept',
      'accepted your connection request',
      connection._id,
      'Connection'
    );

    console.log('✅ Connection request accepted');
    res.json({ success: true, connection });
  } catch (error) {
    console.error('❌ Error accepting connection:', error);
    res.status(500).json({ error: 'Failed to accept connection request' });
  }
}

// Reject a connection request
export async function rejectConnectionRequest(req, res) {
  try {
    const { connection_id } = req.body;
    const user_id = req.user.id; // Fixed: use .id not ._id

    console.log('❌ Rejecting connection request:', { connection_id, user_id });

    const connection = await Connection.findById(connection_id);
    
    if (!connection) {
      return res.status(404).json({ error: 'Connection request not found' });
    }

    // Only recipient can reject
    if (connection.recipient_id.toString() !== user_id.toString()) {
      return res.status(403).json({ error: 'Not authorized to reject this request' });
    }

    connection.status = 'rejected';
    await connection.save();

    console.log('✅ Connection request rejected');
    res.json({ success: true, connection });
  } catch (error) {
    console.error('❌ Error rejecting connection:', error);
    res.status(500).json({ error: 'Failed to reject connection request' });
  }
}

// Get all connections (accepted) for a user
export async function getConnections(req, res) {
  try {
    const user_id = req.user.id; // Fixed: use .id not ._id

    console.log('📋 Getting connections for user:', user_id);

    const connections = await Connection.find({
      $or: [
        { requester_id: user_id, status: 'accepted' },
        { recipient_id: user_id, status: 'accepted' }
      ]
    })
    .populate('requester_id', 'full_name email avatar_url title department')
    .populate('recipient_id', 'full_name email avatar_url title department')
    .sort({ updated_at: -1 });

    // Format connections to return the other user
    const formattedConnections = connections.map(conn => {
      const otherUser = conn.requester_id._id.toString() === user_id.toString()
        ? conn.recipient_id
        : conn.requester_id;
      
      return {
        connection_id: conn._id,
        user: otherUser,
        connected_at: conn.updated_at,
      };
    });

    console.log(`✅ Found ${formattedConnections.length} connections`);
    res.json({ connections: formattedConnections });
  } catch (error) {
    console.error('❌ Error getting connections:', error);
    res.status(500).json({ error: 'Failed to get connections' });
  }
}

// Get pending connection requests (received)
export async function getPendingRequests(req, res) {
  try {
    const user_id = req.user.id; // Fixed: use .id not ._id

    console.log('📨 Getting pending requests for user:', user_id);

    const requests = await Connection.find({
      recipient_id: user_id,
      status: 'pending'
    })
    .populate('requester_id', 'full_name email avatar_url title department')
    .sort({ created_at: -1 });

    const formattedRequests = requests.map(req => ({
      connection_id: req._id,
      user: req.requester_id,
      requested_at: req.created_at,
    }));

    console.log(`✅ Found ${formattedRequests.length} pending requests`);
    res.json({ requests: formattedRequests });
  } catch (error) {
    console.error('❌ Error getting pending requests:', error);
    res.status(500).json({ error: 'Failed to get pending requests' });
  }
}

// Get connection status between current user and another user
export async function getConnectionStatus(req, res) {
  try {
    const user_id = req.user.id; // Fixed: use .id not ._id
    const { other_user_id } = req.params;

    console.log('🔍 Checking connection status:', { user_id, other_user_id });

    if (user_id.toString() === other_user_id) {
      return res.json({ status: 'self' });
    }

    const connection = await Connection.findOne({
      $or: [
        { requester_id: user_id, recipient_id: other_user_id },
        { requester_id: other_user_id, recipient_id: user_id }
      ]
    });

    if (!connection) {
      return res.json({ status: 'none' });
    }

    // Determine if current user sent or received the request
    const isSent = connection.requester_id.toString() === user_id.toString();
    
    res.json({
      status: connection.status,
      connection_id: connection._id,
      is_requester: isSent,
    });
  } catch (error) {
    console.error('❌ Error getting connection status:', error);
    res.status(500).json({ error: 'Failed to get connection status' });
  }
}

// Remove a connection
export async function removeConnection(req, res) {
  try {
    const { connection_id } = req.body;
    const user_id = req.user.id; // Fixed: use .id not ._id

    console.log('🗑️ Removing connection:', { connection_id, user_id });

    const connection = await Connection.findById(connection_id);
    
    if (!connection) {
      return res.status(404).json({ error: 'Connection not found' });
    }

    // Only users involved in the connection can remove it
    const isInvolved = connection.requester_id.toString() === user_id.toString() ||
                      connection.recipient_id.toString() === user_id.toString();
    
    if (!isInvolved) {
      return res.status(403).json({ error: 'Not authorized to remove this connection' });
    }

    await Connection.findByIdAndDelete(connection_id);

    console.log('✅ Connection removed');
    res.json({ success: true });
  } catch (error) {
    console.error('❌ Error removing connection:', error);
    res.status(500).json({ error: 'Failed to remove connection' });
  }
}
