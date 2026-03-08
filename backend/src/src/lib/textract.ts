import {
  TextractClient,
  DetectDocumentTextCommand,
  Block,
} from "@aws-sdk/client-textract";
import { S3Client, GetObjectCommand } from "@aws-sdk/client-s3";

const textractClient = new TextractClient({
  region: process.env.AWS_REGION || "ap-south-1",
});

const s3Client = new S3Client({
  region: process.env.AWS_REGION || "ap-south-1",
});

// ─── Extract text from S3 document ────────────────────
export async function extractTextFromS3(
  bucketName: string,
  s3Key: string,
): Promise<string> {
  console.log(`Extracting text from s3://${bucketName}/${s3Key}`);

  const command = new DetectDocumentTextCommand({
    Document: {
      S3Object: {
        Bucket: bucketName,
        Name: s3Key,
      },
    },
  });

  const response = await textractClient.send(command);

  if (!response.Blocks) {
    throw new Error("No text blocks found in document");
  }

  // Extract all LINE blocks and join them
  const lines = response.Blocks.filter(
    (block: Block) => block.BlockType === "LINE",
  )
    .map((block: Block) => block.Text || "")
    .filter((text) => text.trim().length > 0);

  const extractedText = lines.join("\n");
  console.log(`Extracted ${lines.length} lines of text`);

  return extractedText;
}

// ─── Extract text from buffer (for images) ────────────
export async function extractTextFromBuffer(
  imageBuffer: Buffer,
): Promise<string> {
  const command = new DetectDocumentTextCommand({
    Document: {
      Bytes: imageBuffer,
    },
  });

  const response = await textractClient.send(command);

  if (!response.Blocks) {
    return "";
  }

  const lines = response.Blocks.filter(
    (block: Block) => block.BlockType === "LINE",
  )
    .map((block: Block) => block.Text || "")
    .filter((text) => text.trim().length > 0);

  return lines.join("\n");
}

// ─── Get object from S3 ───────────────────────────────
export async function getS3Object(
  bucketName: string,
  s3Key: string,
): Promise<Buffer> {
  const command = new GetObjectCommand({
    Bucket: bucketName,
    Key: s3Key,
  });

  const response = await s3Client.send(command);

  if (!response.Body) {
    throw new Error("Empty S3 object");
  }

  const chunks: Uint8Array[] = [];
  for await (const chunk of response.Body as AsyncIterable<Uint8Array>) {
    chunks.push(chunk);
  }

  return Buffer.concat(chunks);
}
