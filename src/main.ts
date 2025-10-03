// src/main.ts
import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.enableCors();
  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );

  // Swagger 설정
  const config = new DocumentBuilder()
    .setTitle('Upload API')
    .setDescription('파일 업로드 API 문서')
    .setVersion('1.0')
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document);

  const server = await app.listen(3000);
  
  // 서버 타임아웃 설정 (30분)
  server.setTimeout(1800000);
  server.keepAliveTimeout = 1800000;
  server.headersTimeout = 1900000;

  console.log('Application is running on: http://localhost:3000');
  console.log('Swagger is running on: http://localhost:3000/api');
}
bootstrap();