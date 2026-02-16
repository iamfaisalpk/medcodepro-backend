import multer from 'multer';
import { Request } from 'express';

// Configure multer storage for file uploads
const storage = multer.memoryStorage(); // Store in memory for PDF parsing

// File filter to only accept PDFs
const fileFilter = (req: Request, file: Express.Multer.File, cb: any) => {
  const allowedMimes = ['application/pdf'];
  
  if (allowedMimes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Only PDF files are allowed'));
  }
};

// Configure multer
export const uploadPDF = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB max file size
  },
});
