/**
 * Input para actualizar una dirección en el repositorio. Todos los campos son opcionales.
 */
export interface UpdateAddressInput {
  address?: string;
  city?: string;
  province?: string;
  postalCode?: string;
  notes?: string | null;
  label?: string | null;
}
