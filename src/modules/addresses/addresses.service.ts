import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { ERROR_CODES } from '../../common/constants/error-codes';
import { AddressesRepository } from './addresses.repository';
import { AddressView } from './interfaces/address-view.interface';
import { CreateAddressDto } from './dto/create-address.dto';
import { UpdateAddressDto } from './dto/update-address.dto';

@Injectable()
export class AddressesService {
  constructor(
    private readonly addressesRepository: AddressesRepository,
    private readonly prisma: PrismaService,
  ) {}

  async findAll(userId: string): Promise<AddressView[]> {
    return this.addressesRepository.findByUserId(userId);
  }

  async create(userId: string, dto: CreateAddressDto): Promise<AddressView> {
    const count = await this.addressesRepository.countByUserId(userId);
    const isDefault = count === 0;

    return this.addressesRepository.createAddress({
      userId,
      address: dto.address,
      city: dto.city,
      province: dto.province,
      postalCode: dto.postalCode,
      notes: dto.notes ?? null,
      label: dto.label ?? null,
      isDefault,
    });
  }

  async update(userId: string, id: string, dto: UpdateAddressDto): Promise<AddressView> {
    const existing = await this.addressesRepository.findByIdAndUser(id, userId);
    if (!existing) {
      throw new NotFoundException({
        message: 'Dirección no encontrada',
        code: ERROR_CODES.RECORD_NOT_FOUND,
      });
    }
    if (existing.userId !== userId) {
      throw new ForbiddenException({
        message: 'No tenés permiso para modificar esta dirección',
        code: ERROR_CODES.FORBIDDEN,
      });
    }

    return this.addressesRepository.updateAddress(id, userId, {
      address: dto.address,
      city: dto.city,
      province: dto.province,
      postalCode: dto.postalCode,
      notes: dto.notes,
      label: dto.label,
    });
  }

  async delete(userId: string, id: string): Promise<{ message: string }> {
    const existing = await this.addressesRepository.findByIdAndUser(id, userId);
    if (!existing) {
      throw new NotFoundException({
        message: 'Dirección no encontrada',
        code: ERROR_CODES.RECORD_NOT_FOUND,
      });
    }
    if (existing.userId !== userId) {
      throw new ForbiddenException({
        message: 'No tenés permiso para eliminar esta dirección',
        code: ERROR_CODES.FORBIDDEN,
      });
    }

    if (existing.isDefault) {
      const other = await this.addressesRepository.findMostRecentOther(userId, id);
      if (other) {
        // Atomic: delete the default and promote the most recent other
        await this.prisma.$transaction([
          this.prisma.address.delete({ where: { id } }),
          this.prisma.address.update({ where: { id: other.id }, data: { isDefault: true } }),
        ]);
      } else {
        // Last address — just delete, no promotion needed
        await this.addressesRepository.deleteAddress(id);
      }
    } else {
      await this.addressesRepository.deleteAddress(id);
    }

    return { message: 'Dirección eliminada correctamente' };
  }

  async setDefault(userId: string, id: string): Promise<AddressView> {
    const existing = await this.addressesRepository.findByIdAndUser(id, userId);
    if (!existing) {
      throw new NotFoundException({
        message: 'Dirección no encontrada',
        code: ERROR_CODES.RECORD_NOT_FOUND,
      });
    }
    if (existing.userId !== userId) {
      throw new ForbiddenException({
        message: 'No tenés permiso para modificar esta dirección',
        code: ERROR_CODES.FORBIDDEN,
      });
    }

    // Atomic: clear all defaults for this user, then set target to true
    await this.prisma.$transaction([
      this.prisma.address.updateMany({ where: { userId }, data: { isDefault: false } }),
      this.prisma.address.update({ where: { id }, data: { isDefault: true } }),
    ]);

    const updated = await this.addressesRepository.findByIdAndUser(id, userId);
    return updated!;
  }
}
