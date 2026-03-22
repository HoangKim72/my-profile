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
}

export type ProjectStatus = "DRAFT" | "PUBLISHED" | "ARCHIVED";
export type Visibility = "PUBLIC" | "PRIVATE" | "SHARED";

export interface ProjectWithDetails extends Project {
  author: UserProfile;
  files: ProjectFile[];
  images: ProjectImage[];
  tags: Tag[];
}

export interface ProjectFile {
  id: string;
  projectId: string;
  fileName: string;
  filePath: string;
  fileType: string;
  mimeType: string;
  sizeBytes: number;
  createdAt: Date;
}

export interface ProjectImage {
  id: string;
  projectId: string;
  imageUrl: string;
  altText?: string;
  sortOrder: number;
}

export interface Tag {
  id: string;
  name: string;
  slug: string;
}

export interface ContactMessage {
  id: string;
  name: string;
  email: string;
  subject: string;
  message: string;
  userId?: string;
  isRead: boolean;
  createdAt: Date;
}

// API Response types
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> {
  success: boolean;
  data: T[];
  total: number;
  page: number;
  pageSize: number;
}

export interface UploadResponse {
  url: string;
  path: string;
  size: number;
  mimeType: string;
}
