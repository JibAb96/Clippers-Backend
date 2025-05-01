import { ClipperInterface } from "./clipper-profile.interface";
import { CreatorProfileInterface } from './creator-profle.interface';

export interface UserResponse {
  user: CreatorProfileInterface | ClipperInterface;
  token?: string;
  refreshToken?: string;
}
