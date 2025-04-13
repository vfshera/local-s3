import fs from "node:fs/promises";
import path from "node:path";
import type { ObjectMetadata } from "../types";
import { METADATA_FILE_POSTFIX } from "../constants";

/**
 * Create the metadata file path for an object
 * @param metadataDir - Base metadata directory
 * @param bucketName - Bucket name
 * @param objectKey - Object key
 * @returns Metadata file path
 */
export function createMetadataPath(
  metadataDir: string,
  bucketName: string,
  objectKey: string
): string {
  return path.join(metadataDir, bucketName, objectKey + METADATA_FILE_POSTFIX);
}

/**
 * Write metadata for an object
 * @param metadataDir - Base metadata directory
 * @param bucketName - Bucket name
 * @param objectKey - Object key
 * @param metadata - Metadata to write
 */
export async function writeMetadata(
  metadataDir: string,
  bucketName: string,
  objectKey: string,
  metadata: ObjectMetadata
): Promise<void> {
  const metadataPath = createMetadataPath(metadataDir, bucketName, objectKey);
  metadataDir = path.dirname(metadataPath);

  // Create metadata directory if it doesn't exist
  await fs.mkdir(metadataDir, { recursive: true });

  // Write metadata as JSON
  await fs.writeFile(metadataPath, JSON.stringify(metadata, null, 2));
}

/**
 * Read metadata for an object
 * @param metadataDir - Base metadata directory
 * @param bucketName - Bucket name
 * @param objectKey - Object key
 * @returns Object metadata
 */
export async function readMetadata(
  metadataDir: string,
  bucketName: string,
  objectKey: string
): Promise<ObjectMetadata> {
  const metadataPath = createMetadataPath(metadataDir, bucketName, objectKey);

  try {
    const metadataStr = await fs.readFile(metadataPath, "utf8");
    return JSON.parse(metadataStr);
  } catch (err: any) {
    if (err.code === "ENOENT") {
      // Return basic metadata for object if explicit metadata doesn't exist
      const objectPath = path.join(metadataDir, "..", bucketName, objectKey);
      try {
        const stats = await fs.stat(objectPath);
        return {
          systemMetadata: {
            contentType: "application/octet-stream",
            lastModified: stats.mtime.toISOString(),
            size: stats.size,
            etag: "", // Would need to calculate hash of file
          },
        };
      } catch (statErr) {
        throw statErr;
      }
    }
    throw err;
  }
}
