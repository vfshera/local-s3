export interface MediaUploadState {
  isUploading: boolean;
  progress: number;
  file?: File;
  error?: string;
}

export interface MediaItem {
  id: string;
  title: string;
  description?: string;
  type: "image" | "video";
  url: string;
  thumbnailUrl?: string;
  createdAt: Date;
  updatedAt?: Date;
  size?: number;
}
