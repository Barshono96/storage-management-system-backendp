import { File, IFile } from '../models/file.model';
import { User } from '../models/user.model';
import fs from 'fs';
import path from 'path';

interface FileCreateInput {
  name: string;
  type: 'note' | 'image' | 'pdf';
  size: number;
  path: string;
  owner: string;
  parentFolder?: string | null;
  isPrivate?: boolean;
}

export class StorageService {
  static async createFileRecord(fileData: FileCreateInput): Promise<IFile> {
    try {
      // Check if user exists
      const user = await User.findById(fileData.owner);
      if (!user) {
        throw new Error('User not found');
      }

      // Create file record
      const file = await File.create({
        name: fileData.name,
        type: fileData.type,
        size: fileData.size,
        path: fileData.path,
        owner: fileData.owner,
        parentFolder: fileData.parentFolder || null
      });

      return file;
    } catch (error: any) {
      // If there's an error, delete the uploaded file
      if (fileData.path && fs.existsSync(fileData.path)) {
        fs.unlinkSync(fileData.path);
      }
      throw error;
    }
  }

  static async getFiles(
    userId: string,
    type?: 'note' | 'image' | 'pdf',
    parentFolderId?: string | null,
    isPrivate?: boolean
  ): Promise<IFile[]> {
    const query: any = { owner: userId };
    
    if (type) {
      query.type = type;
    }
    
    if (parentFolderId) {
      query.parentFolder = parentFolderId;
    } else {
      query.parentFolder = null; // Root level files
    }
    
    if (typeof isPrivate === 'boolean') {
      query.isPrivate = isPrivate;
    }

    return File.find(query).sort({ createdAt: -1 });
  }

  static async createFolder(
    name: string,
    userId: string,
    parentFolderId?: string | null
  ): Promise<IFile> {
    // Check if folder with same name exists in the same location
    const existingFolder = await File.findOne({
      name,
      owner: userId,
      parentFolder: parentFolderId || null,
      type: 'folder'
    });

    if (existingFolder) {
      throw new Error('Folder with this name already exists');
    }

    return File.create({
      name,
      type: 'folder',
      size: 0,
      path: '',
      owner: userId,
      parentFolder: parentFolderId || null
    });
  }

  static async getFolder(folderId: string, userId: string): Promise<IFile> {
    const folder = await File.findOne({
      _id: folderId,
      owner: userId,
      type: 'folder'
    });

    if (!folder) {
      throw new Error('Folder not found');
    }

    return folder;
  }

  static async deleteFile(fileId: string, userId: string): Promise<void> {
    const file = await File.findOne({ _id: fileId, owner: userId });
    if (!file) {
      throw new Error('File not found');
    }

    // Delete physical file if it exists
    if (file.path && fs.existsSync(file.path)) {
      fs.unlinkSync(file.path);
    }

    await file.deleteOne();
  }

  static async togglePrivate(
    fileId: string,
    userId: string,
    pin: string
  ): Promise<IFile> {
    const file = await File.findOne({ _id: fileId, owner: userId });
    if (!file) {
      throw new Error('File not found');
    }

    file.isPrivate = !file.isPrivate;
    return file.save();
  }

  static async toggleFavorite(fileId: string, userId: string): Promise<IFile> {
    const file = await File.findOne({ _id: fileId, owner: userId });
    if (!file) {
      throw new Error('File not found');
    }

    file.isFavorite = !file.isFavorite;
    return file.save();
  }

  static async getFavorites(userId: string): Promise<IFile[]> {
    return File.find({ owner: userId, isFavorite: true }).sort({ createdAt: -1 });
  }

  static async getRecentFiles(userId: string): Promise<IFile[]> {
    return File.find({ owner: userId })
      .sort({ createdAt: -1 })
      .limit(10);
  }

  static async getFilesByDate(userId: string, date: Date): Promise<IFile[]> {
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    return File.find({
      owner: userId,
      createdAt: {
        $gte: startOfDay,
        $lte: endOfDay
      }
    }).sort({ createdAt: -1 });
  }

  static async getDashboardStats(userId: string) {
    const [totalFiles, totalSize, recentFiles, favorites] = await Promise.all([
      File.countDocuments({ owner: userId, type: { $ne: 'folder' } }),
      File.aggregate([
        { $match: { owner: userId, type: { $ne: 'folder' } } },
        { $group: { _id: null, total: { $sum: '$size' } } }
      ]),
      File.find({ owner: userId })
        .sort({ createdAt: -1 })
        .limit(5),
      File.find({ owner: userId, isFavorite: true })
        .sort({ createdAt: -1 })
        .limit(5)
    ]);

    return {
      totalFiles,
      totalSize: totalSize[0]?.total || 0,
      recentFiles,
      favorites
    };
  }

  static async renameFile(
    fileId: string, 
    userId: string, 
    newName: string
  ): Promise<IFile> {
    // Find the file
    const file = await File.findOne({ _id: fileId, owner: userId });
    if (!file) {
      throw new Error('File not found');
    }

    // Get file extension from current path
    const ext = path.extname(file.path);
    
    // Create new path with same extension
    const oldPath = file.path;
    const newPath = path.join(
      path.dirname(oldPath),
      `${Date.now()}-${newName}${ext}`
    );

    // Rename physical file if it exists
    if (fs.existsSync(oldPath)) {
      fs.renameSync(oldPath, newPath);
    }

    // Update database record
    file.name = newName;
    file.path = newPath;
    await file.save();

    return file;
  }

  static async duplicateFile(fileId: string, userId: string): Promise<IFile> {
    // Find the original file
    const originalFile = await File.findOne({ _id: fileId, owner: userId });
    if (!originalFile) {
      throw new Error('File not found');
    }

    if (originalFile.type === 'folder') {
      throw new Error('Cannot duplicate folders');
    }

    // Create new file path
    const ext = path.extname(originalFile.path);
    const newPath = path.join(
      path.dirname(originalFile.path),
      `${Date.now()}-copy-${path.basename(originalFile.name, ext)}${ext}`
    );

    // Copy physical file if it exists
    if (fs.existsSync(originalFile.path)) {
      fs.copyFileSync(originalFile.path, newPath);
    }

    // Create new file record
    const duplicatedFile = await File.create({
      name: `Copy of ${originalFile.name}`,
      type: originalFile.type,
      size: originalFile.size,
      path: newPath,
      owner: userId,
      parentFolder: originalFile.parentFolder,
      isPrivate: originalFile.isPrivate,
      isFavorite: false // Don't copy favorite status
    });

    return duplicatedFile;
  }
}
