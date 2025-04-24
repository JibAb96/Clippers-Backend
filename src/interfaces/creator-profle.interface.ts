import { Platform } from '../enums/platform.enum';
import { Niche } from '../enums/niche.enum';

export interface CreatorProfileInterface {
  id: string;
  fullName: string;
  brandName: string;
  email: string;
  socialMediaHandle: string;
  platform: Platform;
  niche: Niche;
  country: string;
}
