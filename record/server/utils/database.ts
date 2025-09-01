import mongoose from 'mongoose';

const MONGODB_URI = process.env.MONGODB_URI?.trim().replace(/^['"]|['"]$/g, '');

let isConnected = false;

export function isDatabaseConnected() {
  return isConnected;
}

export async function connectToDatabase() {
  if (isConnected) {
    return;
  }

  if (!MONGODB_URI) {
    console.warn('MONGODB_URI is not set. Skipping database connection.');
    return;
  }

  if (!MONGODB_URI.startsWith('mongodb://') && !MONGODB_URI.startsWith('mongodb+srv://')) {
    console.warn('MONGODB_URI must start with "mongodb://" or "mongodb+srv://". Skipping database connection.');
    return;
  }

  try {
    const conn = await mongoose.connect(MONGODB_URI, {
      bufferCommands: false,
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    });

    isConnected = conn.connections[0].readyState === 1;
    console.log('Connected to MongoDB Atlas');
    
    return conn;
  } catch (error) {
    console.error('MongoDB connection error:', error);
    if (process.env.NODE_ENV === 'production') {
      throw error;
    } else {
      console.warn('Continuing without a database connection in non-production.');
      return;
    }
  }
}

export { mongoose };
