import { Injectable } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { EVENT_NAMES } from '../../../common/events/event-types';
import { CartService } from '../../cart/cart.service';
import { OrderCreatedEvent } from '../events/order-created.event';

@Injectable()
export class CartListener {
  constructor(private readonly cartService: CartService) {}

  @OnEvent(EVENT_NAMES.order.created)
  async handleOrderCreated(event: OrderCreatedEvent): Promise<void> {
    await this.cartService.clearCart(event.userId);
  }
}
