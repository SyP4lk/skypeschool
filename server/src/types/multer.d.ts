// This file provides a minimal type declaration for the `multer` package.
// It helps TypeScript resolve the module when `@types/multer` is not installed.

declare module 'multer' {
  import { Request } from 'express';
  interface StorageEngine {
    _handleFile(req: Request, file: any, cb: (error?: any, info?: any) => void): void;
    _removeFile(req: Request, file: any, cb: (error: Error) => void): void;
  }
  interface DiskStorageOptions {
    destination?: string | ((req: Request, file: any, cb: (error: Error | null, destination: string) => void) => void);
    filename?: (req: Request, file: any, cb: (error: Error | null, filename: string) => void) => void;
  }
  function diskStorage(options?: DiskStorageOptions): StorageEngine;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  function memoryStorage(): StorageEngine;
  interface Multer {
    single(fieldname: string): any;
    array(fieldname: string, maxCount?: number): any;
    fields(fields: { name: string; maxCount?: number }[]): any;
    any(): any;
    none(): any;
  }
  interface Options {
    storage?: StorageEngine;
    limits?: any;
    fileFilter?: (req: Request, file: any, cb: (error: Error | null, acceptFile: boolean) => void) => void;
  }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  function Multer(options?: Options): any;
  export = Multer;
}