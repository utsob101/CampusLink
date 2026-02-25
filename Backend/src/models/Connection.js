import mongoose from 'mongoose';

const connectionSchema = new mongoose.Schema({
  requester_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true,
  },
  recipient_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true,
  },
  status: {
    type: String,
    enum: ['pending', 'accepted', 'rejected'],
    default: 'pending',
    index: true,
  },
  created_at: {
    type: Date,
    default: Date.now,
    index: true,
  },
  updated_at: {
    type: Date,
    default: Date.now,
  },
});

// Compound index to prevent duplicate connection requests
connectionSchema.index({ requester_id: 1, recipient_id: 1 }, { unique: true });

// Update the updated_at timestamp before saving
connectionSchema.pre('save', function(next) {
  this.updated_at = new Date();
  next();
});

const Connection = mongoose.model('Connection', connectionSchema);

export default Connection;
