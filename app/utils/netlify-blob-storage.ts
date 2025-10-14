import type {
  FileStorage,
  ListOptions,
  ListResult,
} from "@remix-run/file-storage";
import { getStore } from "@netlify/blobs";
import type { Store } from "@netlify/blobs";

/**
 * A FileStorage implementation that uses Netlify Blobs as the backend.
 * This allows seamless integration with Remix's file upload handling while
 * storing files in Netlify Blobs instead of the local filesystem.
 */
export class NetlifyBlobStorage implements FileStorage {
  private store: Store;

  constructor(storeName: string) {
    this.store = getStore(storeName);
  }

  async has(key: string): Promise<boolean> {
    const metadata = await this.store.getMetadata(key);
    return metadata !== null;
  }

  async set(key: string, file: File): Promise<void> {
    // Store the file as an ArrayBuffer
    const arrayBuffer = await file.arrayBuffer();

    // Store file content along with metadata about the original file
    await this.store.set(key, arrayBuffer, {
      metadata: {
        name: file.name,
        type: file.type,
        lastModified: file.lastModified,
        size: file.size,
      },
    });
  }

  async get(key: string): Promise<File | null> {
    const result = await this.store.getWithMetadata(key, {
      type: "arrayBuffer",
    });

    if (!result || !result.data) {
      return null;
    }

    const { data, metadata } = result;

    // Reconstruct the File object from stored data and metadata
    return new File([data], (metadata.name as string) || key, {
      type: (metadata.type as string) || "application/octet-stream",
      lastModified: (metadata.lastModified as number) || Date.now(),
    });
  }

  async put(key: string, file: File): Promise<File> {
    await this.set(key, file);
    return file;
  }

  async list<T extends ListOptions>(
    options?: T
  ): Promise<ListResult<T>> {
    const { blobs } = await this.store.list({
      prefix: options?.prefix,
    });

    // Handle pagination
    const limit = options?.limit;
    const cursor = options?.cursor;
    let startIndex = 0;

    if (cursor) {
      startIndex = parseInt(cursor, 10) || 0;
    }

    const endIndex = limit ? startIndex + limit : blobs.length;
    const paginatedBlobs = blobs.slice(startIndex, endIndex);

    // Prepare the response
    const files: any[] = [];

    if (options?.includeMetadata) {
      for (const blob of paginatedBlobs) {
        const result = await this.store.getMetadata(blob.key);
        if (result && result.metadata) {
          files.push({
            key: blob.key,
            name: result.metadata.name as string,
            type: result.metadata.type as string,
            size: result.metadata.size as number,
            lastModified: result.metadata.lastModified as number,
          });
        } else {
          files.push({ key: blob.key });
        }
      }
    } else {
      for (const blob of paginatedBlobs) {
        files.push({ key: blob.key });
      }
    }

    const result: ListResult<T> = {
      files: files as any,
    };

    // Add cursor if there are more results
    if (endIndex < blobs.length) {
      result.cursor = endIndex.toString();
    }

    return result;
  }

  async remove(key: string): Promise<void> {
    await this.store.delete(key);
  }
}
