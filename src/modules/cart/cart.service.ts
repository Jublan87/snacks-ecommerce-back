import { Injectable } from '@nestjs/common';
import { CartRepository } from './cart.repository';
import { CartValidationService } from './services/cart-validation.service';
import { CartItemDetail, CartWithItems } from './interfaces/cart.interfaces';
import { AddToCartDto } from './dto/add-to-cart.dto';
import { UpdateCartItemDto } from './dto/update-cart-item.dto';

@Injectable()
export class CartService {
  constructor(
    private readonly cartRepository: CartRepository,
    private readonly cartValidationService: CartValidationService,
  ) {}

  async getCart(userId: string): Promise<CartWithItems> {
    return this.cartRepository.findOrCreate(userId);
  }

  async addItem(userId: string, dto: AddToCartDto): Promise<CartItemDetail> {
    const quantity = dto.quantity ?? 1;
    await this.cartValidationService.validateProductForCart(dto.productId, quantity);
    const cart = await this.cartRepository.findOrCreate(userId);
    return this.cartRepository.upsertItem(cart.id, dto.productId, quantity);
  }

  async updateItem(userId: string, itemId: string, dto: UpdateCartItemDto): Promise<CartItemDetail> {
    const item = await this.cartValidationService.validateItemOwnership(itemId, userId);
    await this.cartValidationService.validateProductForCart(item.productId, dto.quantity);
    return this.cartRepository.updateItemQuantity(itemId, dto.quantity);
  }

  async removeItem(userId: string, itemId: string): Promise<{ message: string }> {
    await this.cartValidationService.validateItemOwnership(itemId, userId);
    await this.cartRepository.removeItem(itemId);
    return { message: 'Producto eliminado del carrito' };
  }

  async clearCart(userId: string): Promise<{ message: string }> {
    const cart = await this.cartRepository.findOrCreate(userId);
    await this.cartRepository.clearCart(cart.id);
    return { message: 'Carrito vaciado' };
  }
}
