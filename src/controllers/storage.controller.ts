import { Request, Response } from 'express';
import fs from 'fs';
import path from 'path';
import { File } from '../models/file.model';
import { User } from '../models/user.model';
import { Types } from 'mongoose';
import { AuthRequest } from '../middleware/auth.middleware';

export class StorageController {
  static async uploadFiles(req: AuthRequest, res: Response) {
    try {
      if (!req.files || !Array.isArray(req.files)) {
        return res.status(400).json({ message: 'No files uploaded' });
      }

      const user = await User.findById(req.userId);
      if (!user) {
        return res.status(401).json({ message: 'User not found' });
      }

      // Calculate total size of uploaded files
      const totalSize = (req.files as Express.Multer.File[]).reduce((sum, file) => sum + file.size, 0);

      // Check if user has enough storage space
      if (!user.hasStorageSpace(totalSize)) {
        // Delete uploaded files
        (req.files as Express.Multer.File[]).forEach(file => {
          fs.unlinkSync(file.path);
        });
        return res.status(400).json({ message: 'Storage quota exceeded' });
      }

      // Save files to database
      const savedFiles = [];
      for (const file of req.files as Express.Multer.File[]) {
        const fileDoc = await File.create({
          name: file.originalname,
          type: file.mimetype.startsWith('image/') ? 'image' : 
                file.mimetype === 'application/pdf' ? 'pdf' : 'note',
          size: file.size,
          path: file.path,
          owner: user._id,
          parentFolder: req.body.folderId || null
        });
        savedFiles.push(fileDoc);
      }

      // Update user's storage usage
      await user.updateStorageUsage(totalSize);

      res.status(201).json({
        message: 'Files uploaded successfully',
        files: savedFiles
      });
    } catch (error: any) {
      // Delete uploaded files if database operation fails
      if (req.files && Array.isArray(req.files)) {
        (req.files as Express.Multer.File[]).forEach(file => {
          fs.unlinkSync(file.path);
        });
      }
      res.status(500).json({ message: error.message });
    }
  }

  static async getFiles(req: AuthRequest, res: Response) {
    try {
      const files = await File.find({
        owner: req.userId,
        type: { $ne: 'folder' },
        parentFolder: req.query.folderId || null
      }).sort({ createdAt: -1 });

      res.json(files);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  }

  static async downloadFile(req: AuthRequest, res: Response) {
    try {
      const file = await File.findOne({
        _id: req.params.fileId,
        owner: req.userId,
        type: { $ne: 'folder' }
      });

      if (!file) {
        return res.status(404).json({ message: 'File not found' });
      }

      // Check if file exists in filesystem
      if (!fs.existsSync(file.path)) {
        return res.status(404).json({ message: 'File not found in storage' });
      }

      // Set content disposition and send file
      res.setHeader('Content-Disposition', `attachment; filename="${file.name}"`);
      res.sendFile(file.path);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  }

  static async getFile(req: AuthRequest, res: Response) {
    try {
      const file = await File.findOne({
        _id: req.params.id,
        owner: req.userId
      });

      if (!file) {
        return res.status(404).json({ message: 'File not found' });
      }

      res.json(file);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  }

  static async deleteFile(req: AuthRequest, res: Response) {
    try {
      const file = await File.findOne({
        _id: req.params.fileId,
        owner: req.userId
      });

      if (!file) {
        return res.status(404).json({ message: 'File not found' });
      }

      // Delete file from filesystem if it exists
      if (fs.existsSync(file.path)) {
        fs.unlinkSync(file.path);
      }

      // Update user's storage usage
      const user = await User.findById(req.userId);
      if (user) {
        await user.updateStorageUsage(-file.size);
      }

      // Delete file from database
      await file.deleteOne();

      res.json({ message: 'File deleted successfully' });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  }

  static async createFolder(req: AuthRequest, res: Response) {
    try {
      const { name, parentId } = req.body;

      // Check if folder with same name exists in the same location
      const existingFolder = await File.findOne({
        name,
        owner: req.userId,
        parentFolder: parentId || null,
        type: 'folder'
      });

      if (existingFolder) {
        return res.status(400).json({ message: 'Folder with this name already exists' });
      }

      const folder = await File.create({
        name,
        type: 'folder',
        size: 0,
        path: '',
        owner: req.userId,
        parentFolder: parentId || null
      });

      res.status(201).json(folder);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  }

  static async getFolders(req: AuthRequest, res: Response) {
    try {
      const folders = await File.find({
        owner: req.userId,
        type: 'folder',
        parentFolder: req.query.parentId || null
      }).sort({ name: 1 });

      res.json(folders);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  }

  static async getFolder(req: AuthRequest, res: Response) {
    try {
      const folder = await File.findOne({
        _id: req.params.folderId,
        owner: req.userId,
        type: 'folder'
      });

      if (!folder) {
        return res.status(404).json({ message: 'Folder not found' });
      }

      // Get folder contents
      const contents = await File.find({
        owner: req.userId,
        parentFolder: folder._id
      }).sort({ type: -1, name: 1 });

      res.json({
        folder,
        contents
      });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  }

  static async deleteFolder(req: AuthRequest, res: Response) {
    try {
      const folder = await File.findOne({
        _id: req.params.folderId,
        owner: req.userId,
        type: 'folder'
      });

      if (!folder) {
        return res.status(404).json({ message: 'Folder not found' });
      }

      // Get all files in folder and subfolders recursively
      const files = await File.find({
        owner: req.userId,
        $or: [
          { parentFolder: folder._id },
          { parentFolder: { $in: await this.getSubFolderIds(folder._id, req.userId) } }
        ]
      });

      // Delete all files from filesystem
      for (const file of files) {
        if (file.type !== 'folder' && fs.existsSync(file.path)) {
          fs.unlinkSync(file.path);
        }
      }

      // Update user's storage usage
      const totalSize = files.reduce((sum, file) => sum + file.size, 0);
      const user = await User.findById(req.userId);
      if (user) {
        await user.updateStorageUsage(-totalSize);
      }

      // Delete all files and the folder from database
      await File.deleteMany({
        _id: { $in: [...files.map(f => f._id), folder._id] }
      });

      res.json({ message: 'Folder deleted successfully' });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  }

  static async searchFiles(req: AuthRequest, res: Response) {
    try {
      // Query has already been validated by middleware
      const searchQuery = req.query.query as string;

      const files = await File.find({
        owner: req.userId,
        $or: [
          { name: { $regex: searchQuery, $options: 'i' } },
          { type: { $regex: searchQuery, $options: 'i' } }
        ]
      })
      .select('name type size createdAt updatedAt parentFolder')
      .sort({ createdAt: -1 })
      .limit(50);

      res.json({
        results: files,
        count: files.length,
        query: searchQuery
      });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  }

  private static async getSubFolderIds(folderId: Types.ObjectId | string, userId: string): Promise<Types.ObjectId[]> {
    const subFolders = await File.find({
      owner: userId,
      type: 'folder',
      parentFolder: new Types.ObjectId(folderId)
    });

    const subFolderIds = subFolders.map(f => f._id);
    for (const subFolder of subFolders) {
      const childIds = await this.getSubFolderIds(subFolder._id, userId);
      subFolderIds.push(...childIds);
    }

    return subFolderIds;
  }
}
