import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

let mongoServer = null;

export const connectDB = async () => {
  const uri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/myfolio';
  const isProduction = process.env.NODE_ENV === 'production';
  const allowFallback = !isProduction && process.env.USE_IN_MEMORY_DB_FALLBACK !== 'false';

  try {
    console.log(`[DB] Attempting connection to MongoDB at: ${uri}`);
    // Set a short serverSelectionTimeoutMS so we don't hang if local mongod is absent
    await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 2500,
    });
    console.log(`[DB] Successfully connected to MongoDB at ${mongoose.connection.host}`);
  } catch (err) {
    console.warn(`[DB] Failed to connect to ${uri}: ${err.message}`);

    if (allowFallback) {
      console.log('[DB] Starting fallback MongoDB Memory Server...');
      try {
        const { MongoMemoryServer } = await import('mongodb-memory-server');
        mongoServer = await MongoMemoryServer.create();
        const fallbackUri = mongoServer.getUri();
        await mongoose.connect(fallbackUri);
        console.log(`[DB] Connected to in-memory MongoDB at: ${fallbackUri}`);
        console.log('[DB] Note: Data will be kept in memory during this session.');
      } catch (memoryErr) {
        console.error('[DB] Failed to start MongoDB Memory Server:', memoryErr);
        process.exit(1);
      }
    } else {
      console.error('[DB] Fallback disabled, exiting.');
      process.exit(1);
    }
  }
};

export const closeDB = async () => {
  await mongoose.disconnect();
  if (mongoServer) {
    await mongoServer.stop();
  }
};
