import { Niche } from "../enums/niche.enum";
import { Platform } from "../enums/platform.enum";

export interface ClipperInterface {
  id: string;
  fullName: string;
  brandName: string;
  email: string;
  socialMediaHandle: string;
  platform: Platform;
  niche: Niche;
  country: string;
  followerCount: number;
  pricePerPost: number;
  brandProfilePicture: string | null;
}