import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';

@Module({
  imports: [
    ConfigModule,
    TypeOrmModule.forRoot({
      type: 'better-sqlite3',
      database: 'database/database.sqlite',
      autoLoadEntities: true,
      synchronize: true,
      prepareDatabase: (db: { pragma: (command: string) => void }) => {
        db.pragma('journal_mode = WAL');
        db.pragma('synchronous = NORMAL');
      },
    }),
  ],
})
export class DatabaseModule {}
