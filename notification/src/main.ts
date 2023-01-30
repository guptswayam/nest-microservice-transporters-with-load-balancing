import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';
import { AppModule } from './app.module';
import { RedisPubSubServer } from './common/redisPubsub/redisPubsub.strategy';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.enableShutdownHooks()

  // Then combine it with your microservice

  const configService = app.get<ConfigService>(ConfigService)
  app.connectMicroservice<MicroserviceOptions>({
    strategy: new RedisPubSubServer(configService)
  })

  await app.startAllMicroservices();
  await app.listen(configService.get("app.port"));
}
bootstrap();
