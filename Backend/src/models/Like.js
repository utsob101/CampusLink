import mongoose from 'mongoose';

const LikeSchema = new mongoose.Schema(
  {
    post_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Post', required: true, index: true },
    user_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  },
  { timestamps: true }
);
LikeSchema.index({ post_id: 1, user_id: 1 }, { unique: true });

export default mongoose.model('Like', LikeSchema);
