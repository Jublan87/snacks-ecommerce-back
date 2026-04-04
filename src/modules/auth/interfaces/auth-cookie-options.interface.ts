export interface AuthCookieOptions {
  name: string;
  options: {
    httpOnly: boolean;
    secure: boolean;
    sameSite: 'strict' | 'lax';
    maxAge: number;
    path: string;
  };
}
