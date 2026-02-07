/**
 * Usuario con password para uso en autenticación (login).
 * Solo expone los campos necesarios para validar credenciales.
 */
export interface UserWithPasswordForAuth {
  id: string;
  email: string;
  password: string;
  role: string;
}
