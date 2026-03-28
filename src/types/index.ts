// src/types/index.ts

export type UserRole = "guest" | "viewer" | "admin";

export interface AuthUser {
  id: string;
  email: string;
  role: UserRole;
  profile?: UserProfile;
}

export interface UserProfile {
  id: string;
  userId: string;
  fullName: string | null;
  headline: string | null;
  bio: string | null;
  avatarUrl: string | null;
  email: string | null;
  phone: string | null;
  githubUrl: string | null;
  linkedinUrl: string | null;
  facebookUrl: string | null;
  websiteUrl: string | null;
}

export type ProjectPermissionType = "VIEW" | "EDIT";

export interface ShareableUser {
  id: string;
  email: string;
  fullName: string | null;
  headline: string | null;
}

export interface ProjectShareAccess {
  userId: string;
  permissionType: ProjectPermissionType;
  user: ShareableUser;
}

export interface ProjectFileAsset {
  id: string;
  fileName: string;
  filePath: string;
  fileType: string;
  mimeType: string;
  sizeBytes: number;
  uploadedBy: string | null;
  createdAt: Date;
}

export interface Project {
  id: string;
  slug: string;
  title: string;
  shortDescription: string;
  content: string;
  subjectName: string;
  semester: string;
  techStack: string;
  githubUrl: string | null;
  demoUrl: string | null;
  thumbnailUrl: string | null;
  coverImageUrl: string | null;
  status: ProjectStatus;
  visibility: Visibility;
  authorId: string;
  createdAt: Date;
  updatedAt: Date;
  publishedAt: Date | null;
  files?: ProjectFileAsset[];
}

export type ProjectStatus = "DRAFT" | "PUBLISHED" | "ARCHIVED";
export type Visibility = "PUBLIC" | "PRIVATE" | "SHARED";
