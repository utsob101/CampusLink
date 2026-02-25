import mongoose from 'mongoose';

const UserSchema = new mongoose.Schema(
  {
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    passwordHash: { type: String, required: true },
    full_name: { type: String, trim: true },
    department: { type: String, trim: true },
    batch: { type: String, trim: true },
    student_id: { type: String, trim: true },
    major: { type: String, trim: true },
    year: { type: String, trim: true },
    intake: { type: String, trim: true },
    section: { type: String, trim: true },
    phone: { type: String, trim: true },
    bio: { type: String, trim: true },
    avatar_url: { type: String, trim: true },
  },
  { timestamps: true }
);

export default mongoose.model('User', UserSchema);
