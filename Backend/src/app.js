import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import path from 'path';
import { fileURLToPath } from 'url';
import { loadEnv } from './utils/env.js';

import authRoutes from './routes/auth.routes.js';
import postRoutes from './routes/posts.routes.js';
import commentRoutes from './routes/comments.routes.js';
import uploadRoutes from './routes/uploads.routes.js';
import storiesRoutes from './routes/stories.routes.js';
import connectionsRoutes from './routes/connections.routes.js';
import projectsRoutes from './routes/projects.routes.js';
import messagesRoutes from './routes/messages.routes.js';
import notificationsRoutes from './routes/notifications.routes.js';

loadEnv();
const app = express();

// middlewares
app.use(express.json({ limit: '2mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(morgan('dev'));

// Request timing middleware
app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    if (duration > 1000) {
      console.warn(`⚠️  Slow request: ${req.method} ${req.path} took ${duration}ms`);
    }
  });
  next();
});

// CORS - Allow all origins for development
const origins = (process.env.CORS_ORIGINS || '').split(',').map(o => o.trim()).filter(Boolean);
app.use(cors({ 
  origin: (origin, cb) => {
    // Allow all origins in development
    console.log(`[CORS] Request from origin: ${origin || 'no origin'}`);
    cb(null, true);
  }, 
  credentials: true 
}));

// static uploads
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const uploadDir = path.join(__dirname, '..', process.env.UPLOAD_DIR || 'uploads');
app.use('/uploads', express.static(uploadDir));

// health
app.get('/health', (req, res) => res.json({ ok: true, uptime: process.uptime() }));

// Quick test endpoint
app.get('/api/test', (req, res) => {
  res.json({ ok: true, message: 'API is working', timestamp: new Date().toISOString() });
});

// Database health check
app.get('/api/health/db', async (req, res) => {
  try {
    const mongoose = (await import('mongoose')).default;
    const state = mongoose.connection.readyState;
    const stateMap = { 0: 'disconnected', 1: 'connected', 2: 'connecting', 3: 'disconnecting' };
    
    if (state === 1) {
      const User = (await import('./models/User.js')).default;
      const userCount = await User.countDocuments();
      
      res.json({ 
        ok: true, 
        database: {
          status: stateMap[state],
          name: mongoose.connection.db?.databaseName,
          collections: await mongoose.connection.db.listCollections().toArray().then(c => c.map(x => x.name)),
          userCount
        }
      });
    } else {
      res.status(503).json({ 
        ok: false, 
        database: { status: stateMap[state] } 
      });
    }
  } catch (error) {
    res.status(503).json({ 
      ok: false, 
      error: error.message 
    });
  }
});

// routes
app.use('/api/auth', authRoutes);
app.use('/api/posts', postRoutes);
app.use('/api/comments', commentRoutes);
app.use('/api/uploads', uploadRoutes);
app.use('/api/stories', storiesRoutes);
app.use('/api/connections', connectionsRoutes);
app.use('/api/projects', projectsRoutes);
app.use('/api/messages', messagesRoutes);
app.use('/api/notifications', notificationsRoutes);

// 404
app.use((req, res) => {
  res.status(404).json({ error: 'Not found' });
});

// error handler
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(err.status || 500).json({ error: err.message || 'Server error' });
});

export default app;
