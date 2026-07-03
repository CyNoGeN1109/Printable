import "dotenv/config";
import { S3Client, PutObjectCommand, ListObjectsV2Command, DeleteObjectsCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { nanoid } from "nanoid";

// Initialize S3 Client for Cloudflare R2
const s3 = new S3Client({
  region: "auto",
  endpoint: `https://${process.env.R2_ACCOUNT_ID || "dummy"}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID || "dummy_access_key",
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY || "dummy_secret_key",
  },
  forcePathStyle: true,
});

const BUCKET_NAME = process.env.R2_BUCKET_NAME || 'printable-files';
const PUBLIC_URL = process.env.R2_PUBLIC_URL || 'https://pub-f7a7a8f39e354321867ddc9b68d0fb3e.r2.dev'; // e.g. https://pub-xxx.r2.dev

export async function getUploadUrl(fileName: string, contentType: string) {
  const key = `${nanoid(10)}-${fileName}`;
  
  const command = new PutObjectCommand({
    Bucket: BUCKET_NAME,
    Key: key,
    ContentType: contentType,
  });

  // URL expires in 15 minutes
  const uploadUrl = await getSignedUrl(s3, command, { expiresIn: 900 });
  const publicUrl = `${PUBLIC_URL}/${key}`;

  return { uploadUrl, publicUrl, key };
}

/**
 * Upload a buffer directly to R2 (server-side) and return its public URL.
 * Used for files we receive ourselves (e.g. WhatsApp media) rather than the
 * presigned browser uploads handled by getUploadUrl().
 */
export async function uploadBufferToR2(
  buffer: Buffer,
  fileName: string,
  contentType: string
) {
  const key = `${nanoid(10)}-${fileName}`;

  const command = new PutObjectCommand({
    Bucket: BUCKET_NAME,
    Key: key,
    Body: buffer,
    ContentType: contentType,
  });

  await s3.send(command);
  const publicUrl = `${PUBLIC_URL}/${key}`;

  return { publicUrl, key };
}

/**
 * Deletes a file from R2
 */
export async function deleteFromR2(key: string) {
  try {
    const command = new DeleteObjectsCommand({
      Bucket: BUCKET_NAME,
      Delete: { Objects: [{ Key: key }] },
    });
    await s3.send(command);
    return true;
  } catch (err) {
    console.error("[R2] Delete failed:", err);
    return false;
  }
}

/**
 * Cleanup: Delete files older than 4 hours.
 * Note: Cloudflare R2 also has Lifecycle Rules in the dashboard (min 1 day).
 * This script provides more granular control if needed.
 */
export async function cleanupR2Files() {
  if (!process.env.R2_ACCOUNT_ID) {
    console.log("[R2] Missing credentials. Skipping cleanup.");
    return;
  }

  try {
    const fourHoursAgo = new Date(Date.now() - 4 * 60 * 60 * 1000);
    const toDelete: { Key: string }[] = [];

    // Paginate through ALL objects — ListObjectsV2 returns max 1000 per call
    let continuationToken: string | undefined;
    do {
      const res = await s3.send(new ListObjectsV2Command({
        Bucket: BUCKET_NAME,
        ContinuationToken: continuationToken,
      }));
      for (const item of res.Contents ?? []) {
        if (item.Key && item.LastModified && item.LastModified < fourHoursAgo) {
          toDelete.push({ Key: item.Key });
        }
      }
      continuationToken = res.IsTruncated ? res.NextContinuationToken : undefined;
    } while (continuationToken);

    if (toDelete.length === 0) return;

    // DeleteObjects accepts max 1000 keys per call — chunk accordingly
    const CHUNK = 1000;
    for (let i = 0; i < toDelete.length; i += CHUNK) {
      await s3.send(new DeleteObjectsCommand({
        Bucket: BUCKET_NAME,
        Delete: { Objects: toDelete.slice(i, i + CHUNK) },
      }));
    }
    console.log(`[R2 Cleanup] Deleted ${toDelete.length} expired files.`);
  } catch (err) {
    console.error("[R2 Cleanup] Error:", err);
  }
}
