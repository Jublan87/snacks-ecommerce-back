/**
 * Usuario mínimo expuesto en login/register.
 * Solo lo necesario para el flujo en el front: identificación, saludo y rol.
 * No se exponen lastName, phone, shippingAddress ni metadatos (createdAt, updatedAt).
 */
export interface SessionUser {
  id: string;
  email: string;
  firstName: string;
  role: string;
}
