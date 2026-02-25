import mongoose from 'mongoose';

export async function connectDB() {
  const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/campuslink';
  mongoose.set('strictQuery', true);
  try {
    console.log('[DB] Attempting to connect to MongoDB...');
    console.log('[DB] MongoDB URI:', uri.replace(/:[^:]*@/, ':****@')); // Hide password in logs
    
    await mongoose.connect(uri, {
      autoIndex: true,
    });
    
    console.log('[DB] ✓ MongoDB connected successfully');
    console.log('[DB] Database name:', mongoose.connection.db.databaseName);
    console.log('[DB] Connection state:', mongoose.connection.readyState); // 1 = connected
    
    // Log collections
    const collections = await mongoose.connection.db.listCollections().toArray();
    console.log('[DB] Available collections:', collections.map(c => c.name).join(', '));
    
  } catch (err) {
    console.error('[DB] ✗ MongoDB connection error:', err.message);
    console.error('[DB] Error details:', err);
    throw err;
  }
  
  // Handle connection events
  mongoose.connection.on('disconnected', () => {
    console.warn('[DB] MongoDB disconnected');
  });
  
  mongoose.connection.on('error', (err) => {
    console.error('[DB] MongoDB connection error:', err);
  });
}
