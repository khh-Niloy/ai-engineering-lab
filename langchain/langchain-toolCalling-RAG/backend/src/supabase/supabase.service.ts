import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import * as path from 'path';

export interface UploadResult {
  fileUrl: string;
  path: string;
}

@Injectable()
export class SupabaseService {
  private readonly logger = new Logger(SupabaseService.name);
  private client: SupabaseClient | null = null;
  private readonly bucket: string;

  constructor(private readonly configService: ConfigService) {
    const url =
      this.configService.get<string>('supabase.url') ??
      process.env.SUPABASE_URL;
    const key =
      this.configService.get<string>('supabase.key') ??
      process.env.SUPABASE_KEY;
    this.bucket =
      this.configService.get<string>('supabase.bucket') ??
      process.env.SUPABASE_STORAGE_BUCKET ??
      'documents';

    if (url && key) {
      this.client = createClient(url, key);
      this.logger.log(
        `Supabase client initialized for bucket: "${this.bucket}"`,
      );
    } else {
      this.logger.warn(
        'SUPABASE_URL or SUPABASE_KEY is missing. File uploads to Supabase will require configuration.',
      );
    }
  }

  async uploadFile(file: Express.Multer.File): Promise<UploadResult> {
    if (!file || !file.buffer) {
      throw new BadRequestException('File buffer is required for upload');
    }

    if (!this.client) {
      const url =
        this.configService.get<string>('supabase.url') ??
        process.env.SUPABASE_URL;
      const key =
        this.configService.get<string>('supabase.key') ??
        process.env.SUPABASE_KEY;
      if (url && key) {
        this.client = createClient(url, key);
      } else {
        throw new InternalServerErrorException(
          'Supabase credentials (SUPABASE_URL and SUPABASE_KEY) are not configured in environment',
        );
      }
    }

    const fileExt = path.extname(file.originalname).replace(/^\./, '') || 'bin';
    const timestamp = Date.now();
    const randomSuffix = Math.random().toString(36).substring(2, 8);
    const cleanBaseName = path
      .basename(file.originalname, `.${fileExt}`)
      .replace(/[^a-zA-Z0-9-_]/g, '_');
    const storagePath = `${timestamp}-${cleanBaseName}-${randomSuffix}.${fileExt}`;

    const { error } = await this.client.storage
      .from(this.bucket)
      .upload(storagePath, file.buffer, {
        contentType: file.mimetype || 'application/octet-stream',
        upsert: true,
      });

    if (error) {
      this.logger.error(`Supabase upload failed: ${error.message}`);
      throw new InternalServerErrorException(
        `Failed to upload file to Supabase: ${error.message}`,
      );
    }

    const { data: publicUrlData } = this.client.storage
      .from(this.bucket)
      .getPublicUrl(storagePath);

    this.logger.log(
      `File uploaded successfully to Supabase: ${publicUrlData.publicUrl}`,
    );

    return {
      fileUrl: publicUrlData.publicUrl,
      path: storagePath,
    };
  }
}
