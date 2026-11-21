import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Schema as MongooseSchema, Types } from 'mongoose';
import { Document } from './document.schema';

export type DocumentChunkRecord = HydratedDocument<DocumentChunk>;

@Schema({ _id: false })
export class ChunkMetadata {
  @Prop({
    type: MongooseSchema.Types.ObjectId,
    ref: Document.name,
    required: true,
  })
  documentId: Types.ObjectId;

  @Prop({ required: true })
  fileName: string;

  @Prop({ required: true })
  fileType: string;

  @Prop({ default: '' })
  fileUrl: string;

  @Prop({ required: true, default: 0 })
  chunkIndex: number;

  @Prop({ default: 0 })
  totalChunks: number;

  @Prop({ default: 1 })
  pageNumber: number;

  @Prop({ default: 0 })
  charCount: number;
}

export const ChunkMetadataSchema = SchemaFactory.createForClass(ChunkMetadata);

@Schema({ collection: 'document_chunks', timestamps: true })
export class DocumentChunk {
  @Prop({
    type: MongooseSchema.Types.ObjectId,
    ref: Document.name,
    required: true,
    index: true,
  })
  documentId: Types.ObjectId;

  @Prop({ type: String, required: true })
  text: string;

  @Prop({ type: [Number], required: true })
  embedding: number[];

  @Prop({ type: ChunkMetadataSchema, required: true })
  metadata: ChunkMetadata;
}

export const DocumentChunkSchema = SchemaFactory.createForClass(DocumentChunk);
