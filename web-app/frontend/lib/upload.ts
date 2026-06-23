// FILE: apps/web/lib/upload.ts
// Uploads a file directly to Cloudflare R2 using a presigned URL from the backend.
// The Express backend never touches the file — only generates the upload URL.

/**
 * Upload file directly to Cloudflare R2 (no progress tracking).
 * Uses a PUT request to the presigned URL.
 */
export async function uploadToR2(
  file: File,
  uploadUrl: string
): Promise<void> {
  const res = await fetch(uploadUrl, {
    method: "PUT",
    body: file,
    headers: {
      "Content-Type": file.type,
    },
  });

  if (!res.ok) {
    throw new Error(`R2 upload failed: ${res.statusText}`);
  }
}

/**
 * Upload file with real-time progress reporting via XMLHttpRequest.
 * onProgress receives a value 0-100.
 */
export function uploadToR2WithProgress(
  file: File,
  uploadUrl: string,
  onProgress: (pct: number) => void
): Promise<void> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("PUT", uploadUrl);

    // Set the content type so R2 knows what it is
    xhr.setRequestHeader("Content-Type", file.type);

    xhr.upload.addEventListener("progress", (e) => {
      if (e.lengthComputable) {
        onProgress(Math.round((e.loaded / e.total) * 100));
      }
    });

    xhr.addEventListener("load", () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        resolve();
      } else {
        reject(new Error(`R2 upload failed with status ${xhr.status}`));
      }
    });

    xhr.addEventListener("error", () => reject(new Error("Network error during upload")));
    xhr.addEventListener("abort", () => reject(new Error("Upload aborted")));

    xhr.send(file);
  });
}