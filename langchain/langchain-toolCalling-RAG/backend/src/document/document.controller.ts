import {
  BadRequestException,
  Controller,
  Get,
  Param,
  Post,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { DocumentService } from './document.service';
import { multerOptions } from './config/multer.config';

@Controller(['document', 'documents', ''])
export class DocumentController {
  constructor(private readonly documentService: DocumentService) {}

  @Post('upload')
  @UseInterceptors(FileInterceptor('file', multerOptions))
  async uploadFile(@UploadedFile() file: Express.Multer.File) {
    if (!file) {
      throw new BadRequestException('File is required');
    }
    return this.documentService.handleUpload(file);
  }

  @Get('document')
  async getAllDocuments() {
    return this.documentService.getAllDocuments();
  }

  @Get('document/:id')
  async getDocumentById(@Param('id') id: string) {
    return this.documentService.getDocumentById(id);
  }
}
