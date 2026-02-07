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
  shippingAddress: unknown;
  createdAt: Date;
  updatedAt: Date;
}
