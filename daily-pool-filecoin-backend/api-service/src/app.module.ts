import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AnswerEntity } from './database/entities/answer.entity';
import { DatabaseModule } from './database/database.module';
import { RoundEntity } from './database/entities/round.entity';
import { ConfigModule } from './config/config.module';

@Module({
  imports: [ConfigModule, DatabaseModule, TypeOrmModule.forFeature([AnswerEntity, RoundEntity])],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
