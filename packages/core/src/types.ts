export interface LocalS3Options {
  rootDirectory?: string;
}

export interface BucketInfo {
  name: string;
  creationDate: string;
}

export interface ObjectInfo {
  key: string;
  lastModified: string;
  size: number;
  etag: string;
}

export interface PutObjectResult {
  etag: string;
  key: string;
  bucket: string;
  size: number;
}

export interface DeleteObjectResult {
  key: string;
}

export interface GetObjectResult {
  object: Buffer;
  metadata: ObjectMetadata;
}

export interface SystemMetadata {
  contentType: string;
  size: number;
  lastModified: string;
  etag: string;
}

export interface ObjectMetadata {
  [key: string]: any;
  systemMetadata: SystemMetadata;
}
