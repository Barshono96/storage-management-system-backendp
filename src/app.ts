import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import path from 'path';
import fs from 'fs';
import authRoutes from './routes/auth.routes';
import storageRoutes from './routes/storage.routes';
import { config } from './config';

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Create uploads directory
const uploadsDir = path.join(__dirname, '..', 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Serve static files from uploads directory
app.use('/uploads', express.static(uploadsDir));

// Initialize models
import './models/user.model';
import './models/file.model';

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/storage', storageRoutes);

// Connect to MongoDB with proper settings
mongoose.connect(config.mongoUri, {
  autoCreate: true, // Enable automatic collection creation
})
.then(() => {
  console.log('Connected to MongoDB');
  app.listen(config.port, () => {
    console.log(`Server is running on port ${config.port}`);
  });
})
.catch((error) => {
  console.error('MongoDB connection error:', error);
});

export default app;
