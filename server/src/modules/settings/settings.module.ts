import { Module } from '@nestjs/common';
import { PrismaService } from '../../prisma.service';
import { SettingsController } from './settings.controller';
import { AdminSettingsController } from './admin-settings.controller';
import { PublicSettingsController } from './public-settings.controller';

@Module({
  controllers: [SettingsController, AdminSettingsController, PublicSettingsController],
  providers: [PrismaService],
})
export class SettingsModule {}
