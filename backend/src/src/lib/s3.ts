import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand
} from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'

const s3Client = new S3Client({
  region: process.env.AWS_REGION || 'ap-south-1'
})

const BUCKET_NAME = process.env.S3_BUCKET_NAME || ''

// ─── Generate presigned upload URL ────────────────────
export async function generateUploadUrl(
  s3Key: string,
  contentType: string,
  expiresIn = 300
): Promise<string> {
  const command = new PutObjectCommand({
    Bucket: BUCKET_NAME,
    Key: s3Key,
    ContentType: contentType
  })

  return await getSignedUrl(s3Client, command, { expiresIn })
}

// ─── Generate presigned download URL ──────────────────
export async function generateDownloadUrl(
  s3Key: string,
  expiresIn = 3600
): Promise<string> {
  const command = new GetObjectCommand({
    Bucket: BUCKET_NAME,
    Key: s3Key
  })

  return await getSignedUrl(s3Client, command, { expiresIn })
}

// ─── Delete object ────────────────────────────────────
export async function deleteS3Object(s3Key: string): Promise<void> {
  await s3Client.send(new DeleteObjectCommand({
    Bucket: BUCKET_NAME,
    Key: s3Key
  }))
}

export { BUCKET_NAME }