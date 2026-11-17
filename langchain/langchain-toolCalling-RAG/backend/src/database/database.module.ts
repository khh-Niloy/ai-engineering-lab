import { Logger, Module } from '@nestjs/common';
import { ConfigType } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { Connection, ConnectionStates } from 'mongoose';
import { databaseConfig } from '../config';

const logger = new Logger('DatabaseModule');

@Module({
  imports: [
    MongooseModule.forRootAsync({
      inject: [databaseConfig.KEY],
      useFactory: (dbConfig: ConfigType<typeof databaseConfig>) => ({
        uri: dbConfig.uri,
        connectionFactory: (connection: Connection) => {
          if (connection.readyState === ConnectionStates.connected) {
            logger.log('✅ Connected to MongoDB successfully');
          }
          connection.on('connected', () => {
            logger.log('✅ Connected to MongoDB successfully');
          });
          connection.on('error', (error) => {
            logger.error('❌ MongoDB connection error:', error);
          });
          return connection;
        },
      }),
    }),
  ],
})
export class DatabaseModule {}
