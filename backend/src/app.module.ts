import { Module } from '@nestjs/common';
import { createObserveModule } from '@nestjs/observe';
import { AppController } from './app.controller.js';
import { AppService } from './app.service.js';
import { PrismaModule } from './prisma/prisma.module.js';
import { AuthModule } from './auth/auth.module.js';
import { ClientsModule } from './clients/clients.module.js';


@Module({

  imports: [PrismaModule, AuthModule, ClientsModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
