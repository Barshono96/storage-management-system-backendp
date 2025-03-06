import { body, query, param } from 'express-validator';
import { config } from '../config';

export const uploadValidation = [
  body('type')
    .optional()
    .isIn(['image', 'pdf', 'note'])
    .withMessage('Invalid file type. Must be image, pdf, or note'),
  body('parentFolderId')
    .optional()
    .isMongoId()
    .withMessage('Invalid parent folder ID'),
];

export const createFolderValidation = [
  body('name')
    .trim()
    .notEmpty()
    .withMessage('Folder name is required')
    .isLength({ max: 255 })
    .withMessage('Folder name must be less than 255 characters')
    .matches(/^[a-zA-Z0-9\s\-_\.]+$/)
    .withMessage('Folder name can only contain letters, numbers, spaces, hyphens, underscores, and dots'),
  body('parentId')
    .optional()
    .isMongoId()
    .withMessage('Invalid parent folder ID')
];

export const fileUploadValidation = [
  body('folderId')
    .optional()
    .isMongoId()
    .withMessage('Invalid folder ID')
];

export const fileQueryValidation = [
  query('type')
    .optional()
    .isIn(['folder', 'image', 'pdf', 'note'])
    .withMessage('Invalid file type'),
  query('parentFolderId')
    .optional()
    .isMongoId()
    .withMessage('Invalid parent folder ID'),
  query('isPrivate')
    .optional()
    .isBoolean()
    .withMessage('isPrivate must be true or false'),
];

export const dateQueryValidation = [
  query('date')
    .isISO8601()
    .withMessage('Invalid date format. Use ISO 8601 format (YYYY-MM-DD)'),
];

export const fileIdParamValidation = [
  param('fileId')
    .isMongoId()
    .withMessage('Invalid file ID'),
];

export const pinValidation = [
  body('pin')
    .isLength({ min: 4, max: 4 })
    .isNumeric()
    .withMessage('PIN must be exactly 4 digits'),
];

export const renameValidation = [
  param('fileId')
    .isMongoId()
    .withMessage('Invalid file ID'),
  body('name')
    .trim()
    .notEmpty()
    .withMessage('New name is required')
    .isLength({ max: 255 })
    .withMessage('Name must be less than 255 characters'),
];

export const searchValidation = [
  query('query')
    .trim()
    .notEmpty()
    .withMessage('Search query is required')
    .isLength({ max: 100 })
    .withMessage('Search query must be less than 100 characters')
];
