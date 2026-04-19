import { AddressView } from '../../addresses/interfaces/address-view.interface';

/**
 * Usuario sin el campo password (respuesta de dominio).
 * Sin dependencias de Prisma.
 */
export interface UserWithoutPassword {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone: string | null;
  role: string;
  addresses: AddressView[];
  createdAt: Date;
  updatedAt: Date;
}
