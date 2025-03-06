import dotenv from 'dotenv';
import path from 'path';

// Load environment variables
dotenv.config();

export const config = {
  port: process.env.PORT || 5000,
  mongoUri: process.env.MONGODB_URI || 'mongodb://localhost:27017/storage-system',
  jwtSecret: process.env.JWT_SECRET || 'your-secret-key',
  smtp: {
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT || '587'),
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
  google: {
    clientId: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
  },
  uploadLimits: {
    fileSize: 100 * 1024 * 1024, // 100MB max file size
    allowedTypes: ['note', 'image', 'pdf'],
  },
  paths: {
    uploads: path.join(__dirname, '../../uploads'),
  }
};
