 
/**
 * Validate bucket name according to S3-like rules
 * @param name - Bucket name to validate
 * @returns Whether the name is valid
 */
export function isValidBucketName(name: string): boolean {
  // Bucket names must be between 3 and 63 characters long
  if (!name || name.length < 3 || name.length > 63) {
    return false;
  }

  // Bucket names can consist only of lowercase letters, numbers, dots, and hyphens
  if (!/^[a-z0-9.-]+$/.test(name)) {
    return false;
  }

  // Bucket names must not start or end with a dot or hyphen
  if (/^[.-]|[.-]$/.test(name)) {
    return false;
  }

  // Bucket names must not contain two adjacent dots or underscores
  if (/\.\.|-\.|\.-|--/.test(name)) {
    return false;
  }

  // Bucket names must not be formatted as an IP address
  if (/^\d+\.\d+\.\d+\.\d+$/.test(name)) {
    return false;
  }

  // Additional check for filesystem safety
  if (name.includes("/") || name.includes("\\") || name.includes(":")) {
    return false;
  }

  return true;
}

/**
 * Validate object key
 * @param key - Object key to validate
 * @returns Whether the key is valid
 */
export function isValidObjectKey(key: string): boolean {
  // Must be a non-empty string
  if (!key || typeof key !== "string" || key.length === 0) {
    return false;
  }

  // Object keys can be up to 1024 bytes long
  if (Buffer.from(key).length > 1024) {
    return false;
  }

  // Check for filesystem safety
  if (key.includes("\\") || key.includes(":")) {
    return false;
  }

  return true;
}
