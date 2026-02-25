import mongoose from 'mongoose';

const notificationSchema = new mongoose.Schema({
  recipient: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  sender: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  type: {
    type: String,
    required: true,
    enum: ['like', 'comment', 'message', 'connection_request', 'connection_accept'],
    index: true
  },
  // Reference to the related entity
  reference_id: {
    type: mongoose.Schema.Types.ObjectId,
    required: false
  },
  reference_model: {
    type: String,
    enum: ['Post', 'Comment', 'Message', 'Connection'],
    required: false
  },
  message: {
    type: String,
    required: true
  },
  read: {
    type: Boolean,
    default: false,
    index: true
  },
  read_at: {
    type: Date,
    default: null
  }
}, {
  timestamps: true
});

// Compound index for efficient queries
notificationSchema.index({ recipient: 1, createdAt: -1 });
notificationSchema.index({ recipient: 1, read: 1 });

const Notification = mongoose.model('Notification', notificationSchema);

export default Notification;
