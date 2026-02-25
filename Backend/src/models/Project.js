import mongoose from 'mongoose';

const projectSchema = new mongoose.Schema({
  user_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true,
  },
  title: {
    type: String,
    required: true,
    trim: true,
  },
  description: {
    type: String,
    trim: true,
  },
  category: {
    type: String,
    enum: ['Academic', 'Personal', 'Freelance', 'Open Source', 'Hackathon'],
    default: 'Personal',
  },
  status: {
    type: String,
    enum: ['Planning', 'In Progress', 'Completed', 'On Hold'],
    default: 'Planning',
  },
  skills: {
    type: [String],
    default: [],
  },
  github_url: {
    type: String,
    trim: true,
  },
  demo_url: {
    type: String,
    trim: true,
  },
  team_size: {
    type: Number,
    default: 1,
    min: 1,
  },
  start_date: {
    type: Date,
  },
  end_date: {
    type: Date,
  },
  images: {
    type: [String],
    default: [],
  },
  likes_count: {
    type: Number,
    default: 0,
  },
  views_count: {
    type: Number,
    default: 0,
  },
  created_at: {
    type: Date,
    default: Date.now,
  },
  updated_at: {
    type: Date,
    default: Date.now,
  },
});

// Update the updated_at timestamp before saving
projectSchema.pre('save', function (next) {
  this.updated_at = Date.now();
  next();
});

// Index for efficient queries
projectSchema.index({ user_id: 1, status: 1, created_at: -1 });
projectSchema.index({ category: 1 });
projectSchema.index({ skills: 1 });

const Project = mongoose.model('Project', projectSchema);

export default Project;
