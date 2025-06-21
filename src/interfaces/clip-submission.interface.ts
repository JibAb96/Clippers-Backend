import { ClipStatus } from '../enums/clip-status.enum';

export interface ClipSubmission {
  id: string;
  creatorId: string;
  clipperId: string;
  description: string;
  clipUrl: string;
  thumbnailUrl: string;
  title: string;
  status: ClipStatus;
  createdAt: Date;
  updatedAt: Date;
}
