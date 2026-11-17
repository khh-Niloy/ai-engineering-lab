import databaseConfig from './database.config';

describe('databaseConfig namespace', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    jest.resetModules();
    process.env = { ...originalEnv };
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  it('should fallback to default mongodb uri when env vars are missing', () => {
    delete process.env.DATABASE_URL;
    delete process.env.MONGODB_URI;

    const config = databaseConfig();

    expect(config.uri).toBe('mongodb://localhost:27017/langchain_rag');
  });

  it('should return uri from MONGODB_URI or DATABASE_URL', () => {
    process.env.MONGODB_URI = 'mongodb+srv://cluster.mongodb.net/rag_db';

    const config = databaseConfig();

    expect(config.uri).toBe('mongodb+srv://cluster.mongodb.net/rag_db');
  });
});
