import { IUserDocument } from './auth.types';

declare global {
  namespace Express {
    interface Request {
      userId?: string;
      user?: IUserDocument;
    }
  }
}



// import { IUserDocument } from '../types/auth.types';  // Ensure the path is correct

// declare global {
//   namespace Express {
//     interface Request {
//       userId?: string;
//       user?: IUserDocument | null;  // Allow null for better type safety
//     }
//   }
// }

// export {};  // Ensure this file is treated as a module
