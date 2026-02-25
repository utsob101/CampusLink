import mongoose from 'mongoose';

const StorySchema = new mongoose.Schema(
  {
    user_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    image_url: { type: String, required: true },
    text: { type: String, default: '' },
    background_color: { type: String, default: '#6C63FF' },
    expires_at: { type: Date, required: true, index: true },
    views_count: { type: Number, default: 0 },
    viewers: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  },
  { timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } }
);

// Index for querying active stories
StorySchema.index({ expires_at: 1, created_at: -1 });

export default mongoose.model('Story', StorySchema);
