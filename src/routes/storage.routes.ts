import { Router } from 'express';
import { StorageController } from '../controllers/storage.controller';
import { auth, AuthRequest } from '../middleware/auth.middleware';
import { validateRequest } from '../middleware/validation.middleware';
import { 
  createFolderValidation, 
  fileUploadValidation,
  searchValidation 
} from '../middleware/storage.validation';
import multer from 'multer';
import path from 'path';
import { RequestHandler, Response } from 'express';

const router = Router();

// Type assertion function to handle AuthRequest
const handleAuth = <T>(handler: (req: AuthRequest, res: Response) => Promise<T>): RequestHandler => {
  return (req, res, next) => handler(req as AuthRequest, res).catch(next);
};

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, '../../uploads'));
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage,
  limits: {
    fileSize: 100 * 1024 * 1024 // 100MB limit
  }
});

// Apply auth middleware to all routes
router.use(auth);

// Folder routes
router.post(
  '/folders',
  createFolderValidation,
  validateRequest,
  handleAuth(StorageController.createFolder)
);

router.get('/folders', handleAuth(StorageController.getFolders));
router.get('/folders/:folderId', handleAuth(StorageController.getFolder));
router.delete('/folders/:folderId', handleAuth(StorageController.deleteFolder));

// File routes
router.post(
  '/upload',
  upload.array('files', 10), // Allow up to 10 files
  fileUploadValidation,
  validateRequest,
  handleAuth(StorageController.uploadFiles)
);

router.get('/files', handleAuth(StorageController.getFiles));
router.get('/files/:fileId', handleAuth(StorageController.downloadFile));
router.delete('/files/:fileId', handleAuth(StorageController.deleteFile));

// Search routes
router.get(
  '/search',
  searchValidation,
  validateRequest,
  handleAuth(StorageController.searchFiles)
);

export default router;
