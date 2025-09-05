import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import axios from 'axios';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Enable CORS
  app.enableCors();

  // Global validation pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    })
  );

  // Swagger configuration
  const config = new DocumentBuilder()
    .setTitle('Seejam Server API')
    .setDescription(
      'API documentation cho Seejam Server với MongoDB Atlas và xác thực tài khoản. Hỗ trợ đăng ký, đăng nhập và quản lý người dùng.'
    )
    .setVersion('1.0')
    .setContact('Seejam Team', 'https://seejam.com', 'support@seejam.com')
    .setLicense('MIT', 'https://opensource.org/licenses/MIT')
    .addTag('auth', 'Xác thực và đăng nhập - Quản lý đăng ký, đăng nhập và xác thực người dùng')
    .addTag('users', 'Quản lý người dùng - Các chức năng của người dùng')
    .addTag('equipment', 'Quản lý trang bị - CRUD trang bị vũ khí, giáp, phụ kiện')
    .addTag('cards', 'Quản lý card - CRUD thẻ kỹ năng/buff')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        name: 'JWT',
        description: 'Nhập JWT token để xác thực API calls',
        in: 'header',
      },
      'JWT-auth'
    )
    .build();

  const document = SwaggerModule.createDocument(app, config);

  // Cải thiện Swagger UI options
  SwaggerModule.setup('api', app, document, {
    swaggerOptions: {
      persistAuthorization: true,
      displayRequestDuration: true,
      filter: true,
      showExtensions: true,
      showCommonExtensions: true,
    },
    customSiteTitle: 'Seejam Server API Documentation',
  });

  const port = process.env.PORT || 3000;
  const serverUrl = process.env.BASE_URL || 'http://localhost:3000';
  await app.listen(port);
  console.log(`🚀 Server đang chạy trên port ${port}`);
  console.log(`📚 Swagger documentation: http://localhost:${port}/api`);

  const baseUrl = process.env.BASE_URL;
  setInterval(
    () => {
      axios.get(baseUrl);
    },
    15 * 60 * 1000
  );

  console.log(`🔄 Bắt đầu tự ping server mỗi 15 phút...`);
}
bootstrap();
