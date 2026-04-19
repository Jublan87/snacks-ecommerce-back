import { Injectable } from '@nestjs/common';
import { Address, Prisma } from '@prisma/client';
import { PrismaService } from '../../database/prisma.service';
import { BaseRepository } from '../../database/repositories/base.repository';
import { AddressView } from './interfaces/address-view.interface';
import { CreateAddressInput } from './interfaces/create-address-input.interface';
import { UpdateAddressInput } from './interfaces/update-address-input.interface';

@Injectable()
export class AddressesRepository extends BaseRepository<
  Address,
  Prisma.AddressCreateInput,
  Prisma.AddressUpdateInput,
  Prisma.AddressWhereInput
> {
  constructor(protected readonly prisma: PrismaService) {
    super(prisma, 'address');
  }

  async findByUserId(userId: string): Promise<AddressView[]> {
    const rows = await this.prisma.address.findMany({
      where: { userId },
      orderBy: { createdAt: 'asc' },
    });
    return rows.map((r) => this.toView(r));
  }

  async countByUserId(userId: string): Promise<number> {
    return this.prisma.address.count({ where: { userId } });
  }

  async findByIdAndUser(id: string, userId: string): Promise<AddressView | null> {
    const row = await this.prisma.address.findFirst({ where: { id, userId } });
    return row ? this.toView(row) : null;
  }

  async createAddress(input: CreateAddressInput): Promise<AddressView> {
    const row = await this.prisma.address.create({
      data: {
        address: input.address,
        city: input.city,
        province: input.province,
        postalCode: input.postalCode,
        notes: input.notes ?? null,
        label: input.label ?? null,
        isDefault: input.isDefault,
        user: { connect: { id: input.userId } },
      },
    });
    return this.toView(row);
  }

  async updateAddress(id: string, userId: string, input: UpdateAddressInput): Promise<AddressView> {
    const row = await this.prisma.address.update({
      where: { id },
      data: {
        ...(input.address !== undefined && { address: input.address }),
        ...(input.city !== undefined && { city: input.city }),
        ...(input.province !== undefined && { province: input.province }),
        ...(input.postalCode !== undefined && { postalCode: input.postalCode }),
        ...(input.notes !== undefined && { notes: input.notes }),
        ...(input.label !== undefined && { label: input.label }),
      },
    });
    void userId; // ownership verified by service before calling this method
    return this.toView(row);
  }

  async deleteAddress(id: string): Promise<void> {
    await this.prisma.address.delete({ where: { id } });
  }

  async findMostRecentOther(userId: string, excludeId: string): Promise<AddressView | null> {
    const row = await this.prisma.address.findFirst({
      where: { userId, id: { not: excludeId } },
      orderBy: { createdAt: 'desc' },
    });
    return row ? this.toView(row) : null;
  }

  private toView(row: Address): AddressView {
    return {
      id: row.id,
      userId: row.userId,
      address: row.address,
      city: row.city,
      province: row.province,
      postalCode: row.postalCode,
      notes: row.notes,
      label: row.label,
      isDefault: row.isDefault,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    };
  }
}
