import { BadRequestException } from '@nestjs/common';
import { memoryStorage, Options } from 'multer';
import * as path from 'path';

export const multerOptions: Options = {
  storage: memoryStorage(),
  limits: {
    fileSize: 25 * 1024 * 1024, // 25 MB
  },
  fileFilter: (
    _req,
    file,
    cb: (error: Error | null, acceptFile: boolean) => void,
  ) => {
    const allowedExtensions = ['.pdf', '.docx', '.csv', '.txt', '.md', '.json'];
    const ext = path.extname(file.originalname).toLowerCase();

    if (!allowedExtensions.includes(ext)) {
      cb(
        new BadRequestException(
          `Invalid file format "${ext}". Supported formats: ${allowedExtensions.join(', ')}`,
        ),
        false,
      );
      return;
    }

    cb(null, true);
  },
};
