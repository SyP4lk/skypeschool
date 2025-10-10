import { Module } from '@nestjs/common';
import { PrismaService } from '../../prisma.service';
import {
  SupportPublicController,
  SupportThreadsPublicController,
  AdminSupportThreadsController,
} from './support.threads.controller';

@Module({
  controllers: [
    SupportPublicController,         // POST /support (виджет)
    SupportThreadsPublicController,  // GET  /support/threads/:id/messages (публичный просмотр)
    AdminSupportThreadsController,   // /admin/support/threads* (админка)
  ],
  providers: [PrismaService],
})
export class SupportModule {}
