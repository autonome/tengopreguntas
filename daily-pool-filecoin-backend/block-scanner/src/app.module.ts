import { Module } from '@nestjs/common';
import { AppService } from './app.service';
import { ConfigModule } from './config/config.module';
import { DatabaseModule } from './database/database.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AnswerEntity } from './database/entities/answer.entity';

@Module({
  imports: [ConfigModule, DatabaseModule, TypeOrmModule.forFeature([AnswerEntity])],
  providers: [AppService],
})
export class AppModule {}
