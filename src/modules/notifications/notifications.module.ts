import { Module } from '@nestjs/common';
import { NotificationListener } from './listeners/notification.listener';
import { PdfService } from './services/pdf.service';
import { TelegramService } from './services/telegram.service';

@Module({
  providers: [PdfService, TelegramService, NotificationListener],
})
export class NotificationsModule {}
