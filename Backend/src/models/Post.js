import mongoose from 'mongoose';

const PostSchema = new mongoose.Schema(
  {
    user_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    content: { type: String, default: '' },
    category: { type: String, default: 'general' },
    privacy: { type: String, enum: ['public', 'friends', 'private'], default: 'public' },
    image_urls: [{ type: String }],
    feeling: { type: String },
    event_details: {
      date: String,
      time: String,
      location: String,
    },
    tags: [{ type: String }],
    shared_post_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Post', default: null },
    likes_count: { type: Number, default: 0 },
    comments_count: { type: Number, default: 0 },
    shares_count: { type: Number, default: 0 },
  },
  { timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } }
);

export default mongoose.model('Post', PostSchema);
