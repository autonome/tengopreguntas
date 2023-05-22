import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder } from '@nestjs/swagger';
import { SwaggerModule } from '@nestjs/swagger/dist';
import { AppModule } from './app.module';
import { json } from 'body-parser';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    logger:
      process.env.NODE_ENV === 'dev'
        ? ['log', 'error', 'warn', 'debug', 'verbose']
        : ['log', 'error', 'warn'],
  });
  app.useGlobalPipes(new ValidationPipe());
  app.use(json({ limit: '50mb' }));

  app.enableCors();

  const config = new DocumentBuilder()
    .setTitle('Daily-Pool-API-Backend')
    .setDescription('Daily-Pool API Backend')
    .setVersion('1.0')
    .addTag('daily-pool-api-backend')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('docs', app, document);

  await app.listen(process.env.PORT || 5001);
}
bootstrap();
