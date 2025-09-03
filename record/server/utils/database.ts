import mongoose from 'mongoose';

const MONGODB_URI = process.env.MONGODB_URI?.trim().replace(/^['"]|['"]$/g, '');

let isConnected = false;
let memoryServer: any = null;

export function isDatabaseConnected() {
  return isConnected;
}

export async function connectToDatabase() {
  if (isConnected) {
    return;
  }

  let uri = MONGODB_URI;

  if (!uri) {
    const { MongoMemoryServer } = await import('mongodb-memory-server');
    memoryServer = await MongoMemoryServer.create();
    uri = memoryServer.getUri();
    console.log('Using in-memory MongoDB instance');
  }

  if (!uri.startsWith('mongodb://') && !uri.startsWith('mongodb+srv://')) {
    throw new Error('MONGODB_URI must start with "mongodb://" or "mongodb+srv://"');
  }

  try {
    const conn = await mongoose.connect(uri, {
      bufferCommands: false,
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    });

    isConnected = conn.connections[0].readyState === 1;
    console.log('Connected to MongoDB');

    return conn;
  } catch (error) {
    console.error('MongoDB connection error:', error);
    throw error;
  }
}

export { mongoose };
