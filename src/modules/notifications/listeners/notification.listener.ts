import { Injectable } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { EVENT_NAMES } from '../../../common/events/event-types';
import { LoggerService } from '../../../shared/logger/logger.service';
import { OrderConfirmedEvent } from '../../orders/events/order-confirmed.event';
import { PdfService } from '../services/pdf.service';
import { TelegramService } from '../services/telegram.service';

@Injectable()
export class NotificationListener {
  constructor(
    private readonly pdfService: PdfService,
    private readonly telegramService: TelegramService,
    private readonly logger: LoggerService,
  ) {}

  @OnEvent(EVENT_NAMES.order.confirmed)
  handleOrderConfirmed(event: OrderConfirmedEvent): void {
    void this.handleAsync(event);
  }

  private async handleAsync(event: OrderConfirmedEvent): Promise<void> {
    try {
      const pdfBuffer = await this.pdfService.generateRemito(event.orderDetail);
      await this.telegramService.sendToAllAdmins(pdfBuffer, event.orderDetail);
      this.logger.info(
        `Notification sent for order #${event.orderNumber}`,
        'NotificationListener',
        { orderId: event.orderId },
      );
    } catch (err) {
      const error = err instanceof Error ? err.message : String(err);
      this.logger.error('Failed to send order confirmed notification', 'NotificationListener', {
        orderId: event.orderId,
        orderNumber: event.orderNumber,
        error,
      });
    }
  }
}
