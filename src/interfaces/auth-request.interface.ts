import { Request } from 'express';

export interface SupabaseUser {
  id: string;
  email?: string;
  role?: string;
  aud?: string;
}

export interface RequestWithUser extends Request {
  user: SupabaseUser;
}
