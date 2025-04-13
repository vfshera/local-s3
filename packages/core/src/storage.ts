import fs from "node:fs/promises";
import fsSync from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { pipeline } from "node:stream/promises";
import { Readable } from "node:stream";
import {
  createMetadataPath,
  readMetadata,
  writeMetadata,
} from "./utils/metadata";
import { isValidBucketName } from "./utils/validation";
import {
  listFilesRecursively,
  cleanupEmptyDirectories,
} from "./utils/filesystem";
import type {
  LocalS3Options,
  BucketInfo,
  ObjectInfo,
  PutObjectResult,
  DeleteObjectResult,
  GetObjectResult,
  ObjectMetadata,
} from "./types";
import { METADATA_DIRECTORY, ROOT_DIRECTORY } from "./constants";

export class LocalS3Storage {
  private rootDirectory: string;
  private metadataDir: string;

  constructor(options: LocalS3Options = {}) {
    this.rootDirectory =
      options.rootDirectory || path.join(process.cwd(), ROOT_DIRECTORY);
    this.metadataDir = path.join(this.rootDirectory, METADATA_DIRECTORY);

    // Initialize storage directories
    this.initialize();
  }

  /**
   * Initialize storage directories
   */
  public async initialize(): Promise<{
    rootDirectory: string;
    metadataDir: string;
  }> {
    try {
      // Create root directory if it doesn't exist
      await fs.mkdir(this.rootDirectory, { recursive: true });

      // Create metadata directory
      await fs.mkdir(this.metadataDir, { recursive: true });

      return {
        rootDirectory: this.rootDirectory,
        metadataDir: this.metadataDir,
      };
    } catch (err) {
      console.error("Failed to initialize storage:", err);
      throw err;
    }
  }

  /**
   * Create a new bucket
   */
  public async createBucket(bucketName: string): Promise<BucketInfo> {
    if (!isValidBucketName(bucketName)) {
      throw new Error("Invalid bucket name");
    }

    const bucketPath = path.join(this.rootDirectory, bucketName);
    await fs.mkdir(bucketPath, { recursive: true });

    // Create metadata directory for the bucket
    const bucketMetadataPath = path.join(this.metadataDir, bucketName);
    await fs.mkdir(bucketMetadataPath, { recursive: true });

    return {
      name: bucketName,
      creationDate: new Date().toISOString(),
    };
  }

  /**
   * Delete a bucket
   */
  public async deleteBucket(
    bucketName: string
  ): Promise<{ bucketName: string }> {
    const bucketPath = path.join(this.rootDirectory, bucketName);
    const bucketMetadataPath = path.join(this.metadataDir, bucketName);

    // Check if bucket exists
    try {
      await fs.access(bucketPath);
    } catch (err) {
      throw new Error(`Bucket ${bucketName} does not exist`);
    }

    // Check if bucket is empty
    const objects = await this.listObjects(bucketName);
    if (objects.length > 0) {
      throw new Error("Cannot delete non-empty bucket");
    }

    // Delete the bucket and its metadata directory
    await fs.rmdir(bucketPath);
    await fs.rmdir(bucketMetadataPath, { recursive: true });

    return { bucketName };
  }

  /**
   * List all buckets
   */
  public async listBuckets(): Promise<BucketInfo[]> {
    const entries = await fs.readdir(this.rootDirectory, {
      withFileTypes: true,
    });
    const buckets = entries
      .filter(
        (entry) => entry.isDirectory() && entry.name !== METADATA_DIRECTORY
      )
      .map((entry) => ({
        name: entry.name,
        creationDate: new Date().toISOString(), // In a full implementation, store and retrieve actual creation dates
      }));

    return buckets;
  }

  /**
   * Upload an object to a bucket
   */

  public async putObject(
    bucketName: string,
    objectKey: string,
    data: Buffer | Readable,
    metadata: Record<string, any> = {}
  ): Promise<PutObjectResult> {
    const bucketPath = path.join(this.rootDirectory, bucketName);
    const objectPath = path.join(bucketPath, objectKey);
    const objectDir = path.dirname(objectPath);

    // Ensure bucket exists
    try {
      await fs.access(bucketPath);
    } catch (err) {
      throw new Error(`Bucket ${bucketName} does not exist`);
    }

    // Create directories if they don't exist
    await fs.mkdir(objectDir, { recursive: true });

    let etag: string;
    let size: number;

    // Handle the data differently based on whether it's a Buffer or a Readable stream
    if (Buffer.isBuffer(data)) {
      // For Buffer data, use the existing approach
      await fs.writeFile(objectPath, data);

      // Calculate etag (MD5 hash)
      etag = crypto.createHash("md5").update(data).digest("hex");
      size = Buffer.byteLength(data);
    } else if (data instanceof Readable) {
      // For stream data, use streaming approach
      const hash = crypto.createHash("md5");
      const writeStream = fsSync.createWriteStream(objectPath);

      // Set up a counter to track the size
      let dataSize = 0;

      const { Transform } = await import("node:stream");
      // Create a transform stream to calculate hash and size
      const transformStream = new Transform({
        transform(chunk, encoding, callback) {
          // Update hash with the chunk
          hash.update(chunk);

          // Update size counter
          dataSize += chunk.length;

          // Pass the chunk through unchanged
          this.push(chunk);
          callback();
        },
      });

      try {
        // Use pipeline to handle errors properly
        await pipeline(data, transformStream, writeStream);

        // Get the final values after stream completes
        etag = hash.digest("hex");
        size = dataSize;
      } catch (err) {
        // Clean up the file if streaming fails
        try {
          await fs.unlink(objectPath);
        } catch (cleanupErr) {
          console.error(
            "Failed to clean up file after streaming error:",
            cleanupErr
          );
        }
        throw err;
      }
    } else {
      throw new Error("Data must be a Buffer or Readable stream");
    }

    // Store metadata
    const systemMetadata = {
      contentType: metadata.contentType || "application/octet-stream",
      size,
      lastModified: new Date().toISOString(),
      etag,
    };

    await writeMetadata(this.metadataDir, bucketName, objectKey, {
      ...metadata,
      systemMetadata,
    });

    return {
      etag,
      key: objectKey,
      bucket: bucketName,
      size,
    };
  }

  /**
   * Download an object from a bucket
   */
  public async getObject(
    bucketName: string,
    objectKey: string
  ): Promise<GetObjectResult> {
    const objectPath = path.join(this.rootDirectory, bucketName, objectKey);
    const metadata = await readMetadata(
      this.metadataDir,
      bucketName,
      objectKey
    );
    const object = await fs.readFile(objectPath);

    return { object, metadata };
  }

  /**
   * Delete an object from a bucket
   */
  public async deleteObject(
    bucketName: string,
    objectKey: string
  ): Promise<DeleteObjectResult> {
    const objectPath = path.join(this.rootDirectory, bucketName, objectKey);
    const metadataPath = createMetadataPath(
      this.metadataDir,
      bucketName,
      objectKey
    );

    // Delete the object
    await fs.unlink(objectPath);

    // Delete metadata if it exists
    try {
      await fs.unlink(metadataPath);
    } catch (err: any) {
      // Ignore if metadata doesn't exist
      if (err.code !== "ENOENT") {
        throw err;
      }
    }

    // Clean up empty directories
    await cleanupEmptyDirectories(
      path.dirname(objectPath),
      path.join(this.rootDirectory, bucketName)
    );

    return { key: objectKey };
  }

  /**
   * Copy an object from one location to another
   */
  public async copyObject(
    sourceBucket: string,
    sourceKey: string,
    destinationBucket: string,
    destinationKey: string
  ): Promise<PutObjectResult> {
    // Get the source object and its metadata
    const { object, metadata } = await this.getObject(sourceBucket, sourceKey);

    // Create the destination object with the same data and metadata
    return this.putObject(destinationBucket, destinationKey, object, metadata);
  }

  /**
   * List objects in a bucket
   */
  public async listObjects(
    bucketName: string,
    prefix: string = ""
  ): Promise<ObjectInfo[]> {
    const bucketPath = path.join(this.rootDirectory, bucketName);

    // Ensure bucket exists
    try {
      await fs.access(bucketPath);
    } catch (err) {
      throw new Error(`Bucket ${bucketName} does not exist`);
    }

    // Get all files recursively
    const files = await listFilesRecursively(bucketPath, prefix);

    // Format the results and get metadata for each object
    const objects: ObjectInfo[] = [];

    for (const filePath of files) {
      const relativePath = path.relative(bucketPath, filePath);
      const normalizedKey = relativePath.replace(/\\/g, "/"); // Normalize path separators

      try {
        const stats = await fs.stat(filePath);
        const metadata = await readMetadata(
          this.metadataDir,
          bucketName,
          normalizedKey
        );

        objects.push({
          key: normalizedKey,
          lastModified:
            metadata?.systemMetadata?.lastModified || stats.mtime.toISOString(),
          size: metadata?.systemMetadata?.size || stats.size,
          etag: metadata?.systemMetadata?.etag || "",
        });
      } catch (err) {
        // Skip files that can't be accessed
        console.error(`Error accessing ${filePath}:`, err);
      }
    }

    return objects;
  }

  /**
   * Get object metadata
   */
  public async getObjectMetadata(
    bucketName: string,
    objectKey: string
  ): Promise<ObjectMetadata> {
    return readMetadata(this.metadataDir, bucketName, objectKey);
  }
}
