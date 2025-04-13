import fs from "node:fs/promises";
import path from "node:path";

/**
 * List files recursively in a directory
 * @param dir - Directory to list files from
 * @param prefix - Optional prefix filter
 * @returns Array of file paths
 */
export async function listFilesRecursively(
  dir: string,
  prefix: string = ""
): Promise<string[]> {
  let results: string[] = [];

  try {
    const entries = await fs.readdir(dir, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);

      if (entry.isDirectory()) {
        const nestedFiles = await listFilesRecursively(fullPath, prefix);
        results = results.concat(nestedFiles);
      } else {
        const relativePath = path.relative(path.dirname(dir), fullPath);

        // Apply prefix filter
        if (!prefix || relativePath.startsWith(prefix)) {
          results.push(fullPath);
        }
      }
    }
  } catch (err) {
    console.error(`Error reading directory ${dir}:`, err);
  }

  return results;
}

/**
 * Clean up empty directories recursively
 * @param dir - Directory to clean
 * @param rootDir - Root directory to stop at
 */
export async function cleanupEmptyDirectories(
  dir: string,
  rootDir: string
): Promise<void> {
  // Don't delete beyond the root directory
  if (dir === rootDir || path.relative(rootDir, dir).startsWith("..")) {
    return;
  }

  try {
    const files = await fs.readdir(dir);

    // If directory is not empty, don't delete it
    if (files.length > 0) {
      return;
    }

    // Delete the empty directory
    await fs.rmdir(dir);

    // Recursively check and clean parent directory
    await cleanupEmptyDirectories(path.dirname(dir), rootDir);
  } catch (err) {
    // Ignore errors (directory might not exist anymore)
  }
}
