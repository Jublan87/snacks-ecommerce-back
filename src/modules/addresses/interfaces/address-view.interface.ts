/**
 * Vista de una dirección de usuario. No depende de tipos de Prisma.
 */
export interface AddressView {
  id: string;
  userId: string;
  address: string;
  city: string;
  province: string;
  postalCode: string;
  notes?: string | null;
  label?: string | null;
  isDefault: boolean;
  createdAt: Date;
  updatedAt: Date;
}
