import { ClipperInterface } from "./clipper-profile.interface";
import { CreatorProfileInterface } from './creator-profle.interface';

export interface UserResponse {
  user: CreatorProfileInterface | ClipperInterface | null;
  role: "creator" | "clipper";
  token?: string;
  refreshToken?: string;
}
