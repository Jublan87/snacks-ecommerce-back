import { Injectable } from '@nestjs/common';
// eslint-disable-next-line @typescript-eslint/no-require-imports
const PDFDocument = require('pdfkit') as typeof import('pdfkit');
import { AdminOrderDetail } from '../../admin/admin-orders/interfaces/admin-order.interface';
import { LoggerService } from '../../../shared/logger/logger.service';

@Injectable()
export class PdfService {
  constructor(private readonly logger: LoggerService) {}

  generateRemito(order: AdminOrderDetail): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      const doc = new PDFDocument({ size: 'A4', margin: 50 });
      const chunks: Buffer[] = [];

      doc.on('data', (chunk: Buffer) => chunks.push(chunk));
      doc.on('end', () => {
        const concatenated = Buffer.concat(chunks);
        // Fix 2: Use new Uint8Array to force a brand-new ArrayBuffer copy,
        // completely detached from any Node.js buffer pool or shared memory.
        const isolated = Buffer.from(new Uint8Array(concatenated));
        resolve(isolated);
      });
      doc.on('error', (err: Error) => {
        this.logger.error('Error generating PDF remito', 'PdfService', {
          orderId: order.id,
          error: err.message,
        });
        reject(err);
      });

      const formatDate = (date: Date): string => {
        const d = new Date(date);
        return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`;
      };

      const formatCurrency = (amount: number): string =>
        `$${amount.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

      const addr = order.shippingAddress as Record<string, unknown>;
      const safeStr = (key: string): string => {
        const val = addr[key];
        return val != null ? String(val) : '';
      };

      // Header
      doc.fontSize(18).font('Helvetica-Bold').text('Snacks E-commerce', 50, 50);
      doc
        .fontSize(14)
        .font('Helvetica-Bold')
        .text('REMITO', 400, 50, { align: 'right', width: 145 });

      doc.fontSize(10).font('Helvetica');
      doc.text(`Pedido N°: ${order.orderNumber}`, 50, 80);
      doc.text(`Fecha: ${formatDate(order.createdAt)}`, 400, 80, { align: 'right', width: 145 });

      // Divider
      doc.moveTo(50, 105).lineTo(545, 105).stroke();

      // Customer section
      doc.moveDown(0.5);
      doc.fontSize(11).font('Helvetica-Bold').text('Datos del cliente', 50, 115);
      doc.fontSize(10).font('Helvetica');
      doc.text(`Nombre: ${order.user.firstName} ${order.user.lastName}`, 50, 132);
      doc.text(`Email: ${order.user.email}`, 50, 147);

      // Shipping address
      const street = safeStr('street') || safeStr('address');
      const city = safeStr('city');
      const province = safeStr('province') || safeStr('state');
      const postalCode = safeStr('postalCode') || safeStr('zipCode');
      const phone = safeStr('phone');

      let addressY = 162;
      if (street) {
        doc.text(`Dirección: ${street}`, 50, addressY);
        addressY += 15;
      }
      if (city || province) {
        doc.text(`Ciudad/Provincia: ${[city, province].filter(Boolean).join(', ')}`, 50, addressY);
        addressY += 15;
      }
      if (postalCode) {
        doc.text(`CP: ${postalCode}`, 50, addressY);
        addressY += 15;
      }
      if (phone) {
        doc.text(`Teléfono: ${phone}`, 50, addressY);
        addressY += 15;
      }

      // Divider
      const itemsStartY = addressY + 10;
      doc.moveTo(50, itemsStartY).lineTo(545, itemsStartY).stroke();

      // Items table header
      const tableHeaderY = itemsStartY + 10;
      doc.fontSize(10).font('Helvetica-Bold');
      doc.text('Producto', 50, tableHeaderY);
      doc.text('Cant.', 320, tableHeaderY, { width: 50, align: 'right' });
      doc.text('P. Unit.', 375, tableHeaderY, { width: 80, align: 'right' });
      doc.text('Subtotal', 460, tableHeaderY, { width: 85, align: 'right' });

      // Items rows
      doc.font('Helvetica');
      let rowY = tableHeaderY + 18;

      for (const item of order.items) {
        doc.fontSize(9);
        doc.text(item.product.name, 50, rowY, { width: 265 });
        doc.text(String(item.quantity), 320, rowY, { width: 50, align: 'right' });
        doc.text(formatCurrency(item.price), 375, rowY, { width: 80, align: 'right' });
        doc.text(formatCurrency(item.subtotal), 460, rowY, { width: 85, align: 'right' });
        rowY += 18;
      }

      // Divider before totals
      const totalsStartY = rowY + 5;
      doc.moveTo(50, totalsStartY).lineTo(545, totalsStartY).stroke();

      // Totals
      const totalsY = totalsStartY + 10;
      doc.fontSize(10).font('Helvetica');
      doc.text('Subtotal:', 375, totalsY, { width: 80, align: 'right' });
      doc.text(formatCurrency(order.subtotal), 460, totalsY, { width: 85, align: 'right' });

      doc.text('Envío:', 375, totalsY + 18, { width: 80, align: 'right' });
      doc.text(formatCurrency(order.shipping), 460, totalsY + 18, { width: 85, align: 'right' });

      doc.fontSize(12).font('Helvetica-Bold');
      doc.text('TOTAL:', 375, totalsY + 36, { width: 80, align: 'right' });
      doc.text(formatCurrency(order.total), 460, totalsY + 36, { width: 85, align: 'right' });

      // Payment method
      const paymentY = totalsY + 65;
      doc.fontSize(10).font('Helvetica');
      doc.text(`Método de pago: ${order.paymentMethod}`, 50, paymentY);

      // Footer
      doc.fontSize(8).font('Helvetica').fillColor('gray');
      doc.text('Documento no válido como factura', 50, 780, { align: 'center', width: 495 });

      doc.end();
    });
  }
}
