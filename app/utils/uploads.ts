import type { FileUpload } from "@remix-run/fetch-router";
import { NetlifyBlobStorage } from "./netlify-blob-storage";

/**
 * Get the appropriate storage backend based on the environment.
 * Uses different Netlify Blob stores for different deployment contexts.
 */
export const getUploadsStorage = () => {
  const context =
    (globalThis as any).Netlify?.context?.deploy?.context ?? "dev";
  return new NetlifyBlobStorage(`uploads-${context}`);
};

/**
 * Upload handler for file uploads. Stores files in Netlify Blobs and returns
 * a public URL path that can be used to access the file.
 */
export async function uploadHandler(file: FileUpload): Promise<string> {
  // Generate unique key for this file
  let ext = file.name.split(".").pop() || "jpg";
  let key = `${file.fieldName}/${Date.now()}-${Math.random().toString(36).substring(7)}.${ext}`;

  // Store file in Netlify Blobs (FileUpload extends File, so we can pass it directly)
  await getUploadsStorage().set(key, file);

  // Return public URL path
  return `/uploads/${key}`;
}
