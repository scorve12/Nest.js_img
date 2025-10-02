// src/main.ts
import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { json, urlencoded } from 'express';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // 파일 업로드를 위한 body 크기 제한 증가 (CORS 전에 설정)
  app.use(json({ limit: '200mb' }));
  app.use(urlencoded({ extended: true, limit: '200mb' }));

  app.enableCors();
  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );

  // body size 제한 증가
  app.use((req, res, next) => {
    if (req.path === '/upload') {
      req.setTimeout(300000); // 5분 타임아웃
    }
    next();
  });

  // Swagger 설정
  const config = new DocumentBuilder()
    .setTitle('Upload API')
    .setDescription('파일 업로드 API 문서')
    .setVersion('1.0')
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document);


  await app.listen(3000);
  console.log('Application is running on: http://localhost:3000');
  console.log('Swagger is running on: http://localhost:3000/api');
}
bootstrap();