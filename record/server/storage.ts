import { connectToDatabase } from './utils/database';

// MongoDB-based storage interface
export interface IStorage {
  // This interface is now handled by Mongoose models directly
  // Keep for compatibility but models handle the actual storage
}

export class MongoStorage implements IStorage {
  constructor() {
    connectToDatabase();
  }
}

export const storage = new MongoStorage();
