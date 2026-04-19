/**
 * Input para crear una dirección en el repositorio.
 */
export interface CreateAddressInput {
  userId: string;
  address: string;
  city: string;
  province: string;
  postalCode: string;
  notes?: string | null;
  label?: string | null;
  isDefault: boolean;
}
