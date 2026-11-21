import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type GithubAccountRecord = HydratedDocument<GithubAccount>;

@Schema({ timestamps: true, collection: 'github_accounts' })
export class GithubAccount {
  @Prop({ required: true, unique: true })
  githubId: string;

  @Prop({ required: true })
  username: string;

  @Prop({ default: '' })
  displayName: string;

  @Prop({ default: '' })
  avatarUrl: string;

  @Prop({ default: '' })
  email: string;

  @Prop({ required: true })
  accessToken: string;

  @Prop({ default: 'bearer' })
  tokenType: string;

  @Prop({ default: 'read:user repo' })
  scope: string;

  @Prop({ type: Object, default: {} })
  profile: Record<string, unknown>;

  createdAt?: Date;
  updatedAt?: Date;
}

export const GithubAccountSchema = SchemaFactory.createForClass(GithubAccount);
