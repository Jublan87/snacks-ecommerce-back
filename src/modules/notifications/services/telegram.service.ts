import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { LoggerService } from '../../../shared/logger/logger.service';
import { AdminOrderDetail } from '../../admin/admin-orders/interfaces/admin-order.interface';

@Injectable()
export class TelegramService {
  private readonly botToken: string | undefined;
  private readonly adminChatId: string | undefined;

  constructor(
    private readonly configService: ConfigService,
    private readonly logger: LoggerService,
  ) {
    this.botToken = this.configService.get<string>('telegram.botToken');
    if (!this.botToken) {
      this.logger.warn(
        'TELEGRAM_BOT_TOKEN is not configured — Telegram notifications are disabled',
        'TelegramService',
      );
    }

    this.adminChatId = this.configService.get<string>('telegram.chatId');
    if (!this.adminChatId) {
      this.logger.warn(
        'TELEGRAM_CHAT_ID is not configured — Telegram notifications are disabled',
        'TelegramService',
      );
    }
  }

  async sendToAllAdmins(pdfBuffer: Buffer, order: AdminOrderDetail): Promise<void> {
    if (!this.botToken || !this.adminChatId) {
      return;
    }

    const caption = this.buildCaption(order);
    // Fix 1: unique filename per order so Telegram cannot cache/reuse by name
    const filename = `remito-${order.orderNumber}.pdf`;
    const sent = await this.sendDocument(this.adminChatId, pdfBuffer, caption, filename, order.orderNumber);
    if (!sent) {
      this.logger.error(
        'Failed to send Telegram notification to admin after retry',
        'TelegramService',
        { chatId: this.adminChatId, orderId: order.id, orderNumber: order.orderNumber },
      );
    }
  }

  private async sendDocument(chatId: string, pdfBuffer: Buffer, caption: string, filename: string, orderNumber: string): Promise<boolean> {
    const attempt = async (): Promise<boolean> => {
      const formData = new FormData();
      formData.append('chat_id', chatId);
      // Fix 4: new Uint8Array copy at Blob level — forces a fresh allocation
      formData.append(
        'document',
        new Blob([new Uint8Array(pdfBuffer)], { type: 'application/pdf' }),
        filename,
      );
      formData.append('caption', caption);

      const response = await fetch(`https://api.telegram.org/bot${this.botToken}/sendDocument`, {
        method: 'POST',
        body: formData,
      });

      return response.ok;
    };

    try {
      const ok = await attempt();
      if (ok) return true;

      this.logger.warn('First Telegram send attempt failed, retrying in 2s', 'TelegramService', {
        chatId,
      });
      await new Promise((r) => setTimeout(r, 2000));
      return await attempt();
    } catch {
      this.logger.warn('First Telegram send attempt threw, retrying in 2s', 'TelegramService', {
        chatId,
      });
      await new Promise((r) => setTimeout(r, 2000));
      try {
        return await attempt();
      } catch (retryErr) {
        const error = retryErr instanceof Error ? retryErr.message : String(retryErr);
        this.logger.error('Telegram sendDocument retry failed', 'TelegramService', {
          chatId,
          error,
        });
        return false;
      }
    }
  }

  private buildCaption(order: AdminOrderDetail): string {
    const { orderNumber, user, total, items } = order;
    const itemCount = items.reduce((sum, i) => sum + i.quantity, 0);
    const formattedTotal = total.toLocaleString('es-AR', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
    return `Nuevo pedido confirmado #${orderNumber}\nCliente: ${user.firstName} ${user.lastName}\nTotal: $${formattedTotal}\nProductos: ${itemCount} ${itemCount === 1 ? 'unidad' : 'unidades'}`;
  }
}
