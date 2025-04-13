export interface MediaUploadState {
  isUploading: boolean;
  progress: number;
  file?: File;
  error?: string;
}
