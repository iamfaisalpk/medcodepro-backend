declare module 'multer' {
  import { RequestHandler } from 'express';

  namespace multer {
    interface Field {
      name: string;
      maxCount?: number;
    }

    interface File {
      fieldname: string;
      originalname: string;
      encoding: string;
      mimetype: string;
      size: number;
      destination?: string;
      filename?: string;
      path?: string;
      buffer: Buffer;
    }

    interface StorageEngine {
      _handleFile(
        req: Express.Request,
        file: File,
        callback: (error?: any, info?: Partial<File>) => void
      ): void;
      _removeFile(
        req: Express.Request,
        file: File,
        callback: (error: Error | null) => void
      ): void;
    }

    interface Multer {
      single(fieldname: string): RequestHandler;
      array(fieldname: string, maxCount?: number): RequestHandler;
      fields(fields: Field[]): RequestHandler;
      none(): RequestHandler;
      any(): RequestHandler;
    }

    interface Options {
      dest?: string;
      storage?: StorageEngine;
      limits?: {
        fieldNameSize?: number;
        fieldSize?: number;
        fields?: number;
        fileSize?: number;
        files?: number;
        parts?: number;
        headerPairs?: number;
      };
      preservePath?: boolean;
      fileFilter?(
        req: Express.Request,
        file: File,
        callback: (error: Error | null, acceptFile: boolean) => void
      ): void;
    }
  }

  function multer(options?: multer.Options): multer.Multer;

  namespace multer {
    function memoryStorage(): StorageEngine;
    function diskStorage(options: {
      destination?: string | ((req: Express.Request, file: File, cb: (error: Error | null, destination: string) => void) => void);
      filename?: (req: Express.Request, file: File, cb: (error: Error | null, filename: string) => void) => void;
    }): StorageEngine;
  }

  export = multer;
}
