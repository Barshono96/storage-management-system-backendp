import mongoose, { Document, Types } from 'mongoose';

// File interface
export interface IFile extends Document {
  _id: Types.ObjectId;
  name: string;
  type: 'folder' | 'image' | 'pdf' | 'note';  
  size: number;
  path: string;
  owner: Types.ObjectId;
  parentFolder: Types.ObjectId | null;
  isPrivate: boolean;
  isFavorite: boolean;
  mimeType: string;  
  extension: string;  
  createdAt: Date;
  updatedAt: Date;
}

// File Schema
const fileSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  type: {
    type: String,
    required: true,
    enum: ['folder', 'image', 'pdf', 'note']
  },
  size: {
    type: Number,
    required: true,
    default: 0
  },
  path: {
    type: String,
    required: function(this: IFile) {
      return this.type !== 'folder';
    }
  },
  owner: {
    type: Types.ObjectId,
    ref: 'User',
    required: true
  },
  parentFolder: {
    type: Types.ObjectId,
    ref: 'File',
    default: null
  },
  isPrivate: {
    type: Boolean,
    default: false
  },
  isFavorite: {
    type: Boolean,
    default: false
  },
  mimeType: {
    type: String,
    required: function(this: IFile) {
      return this.type !== 'folder';
    }
  },
  extension: {
    type: String,
    required: function(this: IFile) {
      return this.type !== 'folder';
    }
  }
}, {
  timestamps: true,
  collection: 'files'
});

// Create indexes for better query performance
fileSchema.index({ owner: 1, type: 1 });
fileSchema.index({ owner: 1, parentFolder: 1 });
fileSchema.index({ name: 'text', type: 'text' });
fileSchema.index({ owner: 1, isFavorite: 1 });
fileSchema.index({ owner: 1, isPrivate: 1 });
fileSchema.index({ owner: 1, mimeType: 1 });

// Virtual for file URL (if needed)
fileSchema.virtual('url').get(function(this: IFile) {
  return `/storage/files/${this._id}`;
});

export const File = mongoose.model<IFile>('File', fileSchema);
