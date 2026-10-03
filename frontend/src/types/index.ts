export type Role = 'ADMIN' | 'CREATOR' | 'REVIEWER';

export type Platform = 'INSTAGRAM' | ' FACEBOOK' |'LINKEDIN'|'X';

export type PostStatus =
  | 'DRAFT'
  | 'IN_REVIEW'
  | 'CHANGES_REQUESTED'
  | 'APPROVED'
  | 'SCHEDULED'
  | 'PUBLISHED';

  export interface User {
  id: string;
  email: string;
  role: Role;
  name?: string;
}

export interface Post {
  id: string;
  caption: string;
  platform: Platform;
  status: PostStatus;
  scheduledAt?: string;
  version: number;
  clientId: string;
  createdById: string;
  client?: { id: string; brandName: string };
  createdBy?: { id: string; name: string };
}