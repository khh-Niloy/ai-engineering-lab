import { registerAs } from '@nestjs/config';

export interface DatabaseConfig {
  uri: string;
}

export const databaseConfig = registerAs('database', (): DatabaseConfig => ({
  uri:
    process.env.DATABASE_URL ??
    process.env.MONGODB_URI ??
    'mongodb://localhost:27017/langchain_rag',
}));

export default databaseConfig;
