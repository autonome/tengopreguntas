import { Module } from '@nestjs/common';
import { AppService } from './app.service';
import { DatabaseModule } from './database/database.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AnswerEntity } from './database/entities/answer.entity';
import { ConfigModule } from './config/config.module';
import { RoundEntity } from './database/entities/round.entity';

@Module({
  imports: [ConfigModule, DatabaseModule, TypeOrmModule.forFeature([AnswerEntity, RoundEntity])],
  providers: [AppService],
})
export class AppModule {}
