import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { AllExceptionsFilter } from './common/http-exception.filter';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.enableCors();

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  app.useGlobalFilters(new AllExceptionsFilter());

  const config = new DocumentBuilder()
    .setTitle('Leads API — One Million Copy SAS')
    .setDescription(
      'API REST para gestión de leads de marketing digital. Incluye CRUD, estadísticas y resumen con IA.',
    )
    .setVersion('1.0')
    .addBearerAuth()
    .addTag('Leads', 'Gestión de leads')
    .addTag('Auth', 'Autenticación JWT')
    .addTag('Webhook', 'Integración con Typeform')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);

  const port = process.env.PORT || 3000;
  await app.listen(port);
  console.log(`🚀 API corriendo en http://localhost:${port}`);
  console.log(`📚 Swagger docs en http://localhost:${port}/api/docs`);
}
bootstrap();
