import { BadRequestException, Injectable } from '@nestjs/common';
import { OrderStatus } from '@prisma/client';
import { ERROR_CODES } from '../../../../common/constants/error-codes';

const VALID_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  [OrderStatus.pending]: [OrderStatus.confirmed, OrderStatus.cancelled],
  [OrderStatus.confirmed]: [OrderStatus.processing, OrderStatus.cancelled],
  [OrderStatus.processing]: [OrderStatus.shipped, OrderStatus.cancelled],
  [OrderStatus.shipped]: [OrderStatus.delivered],
  [OrderStatus.delivered]: [],
  [OrderStatus.cancelled]: [],
};

@Injectable()
export class OrderStatusValidationService {
  validateStatusTransition(currentStatus: OrderStatus, newStatus: OrderStatus): void {
    const allowedTransitions = VALID_TRANSITIONS[currentStatus] ?? [];

    if (!allowedTransitions.includes(newStatus)) {
      throw new BadRequestException({
        code: ERROR_CODES.INVALID_STATUS_TRANSITION,
        message: `No se puede cambiar el estado de '${currentStatus}' a '${newStatus}'`,
        currentStatus,
        requestedStatus: newStatus,
        allowedTransitions,
      });
    }
  }
}
