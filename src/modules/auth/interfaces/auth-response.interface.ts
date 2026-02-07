import { UserWithoutPassword } from '../../users/interfaces/user-without-password.interface';

export interface AuthResponse {
  user: UserWithoutPassword;
  accessToken: string;
}
