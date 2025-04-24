import { CreatorProfileInterface } from './creator-profle.interface';

export interface UserResponse {
  user: CreatorProfileInterface;
  token?: string;
  refreshToken?: string;
}
