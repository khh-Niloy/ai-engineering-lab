import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ChatController } from './chat.controller';
import { ChatService } from './chat.service';
import { Qna, QnaSchema } from './schemas/qna.schema';
import { Document, DocumentSchema } from '../document/schemas/document.schema';
import {
  DocumentChunk,
  DocumentChunkSchema,
} from '../document/schemas/document-chunk.schema';
import { DocumentModule } from '../document/document.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Qna.name, schema: QnaSchema },
      { name: Document.name, schema: DocumentSchema },
      { name: DocumentChunk.name, schema: DocumentChunkSchema },
    ]),
    DocumentModule,
  ],
  controllers: [ChatController],
  providers: [ChatService],
  exports: [ChatService],
})
export class ChatModule {}
