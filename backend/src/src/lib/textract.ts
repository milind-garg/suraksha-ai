import {
  TextractClient,
  DetectDocumentTextCommand,
  StartDocumentTextDetectionCommand,
  GetDocumentTextDetectionCommand,
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
// For PDFs, uses the asynchronous StartDocumentTextDetection API so that
// all pages are processed.  For image files (JPEG/PNG), falls back to the
// synchronous DetectDocumentText call which only supports a single page.
export async function extractTextFromS3(
  bucketName: string,
  s3Key: string,
): Promise<string> {
  console.log(`Extracting text from s3://${bucketName}/${s3Key}`);

  const isPdf = s3Key.toLowerCase().endsWith(".pdf");

  if (isPdf) {
    return extractMultiPageTextFromS3(bucketName, s3Key);
  }

  // Single-page image fallback
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

  const lines = response.Blocks.filter(
    (block: Block) => block.BlockType === "LINE",
  )
    .map((block: Block) => block.Text || "")
    .filter((text) => text.trim().length > 0);

  const extractedText = lines.join("\n");
  console.log(`Extracted ${lines.length} lines of text`);

  return extractedText;
}

// ─── Async multi-page text extraction for PDFs ────────
async function extractMultiPageTextFromS3(
  bucketName: string,
  s3Key: string,
): Promise<string> {
  // Start asynchronous job
  const startCommand = new StartDocumentTextDetectionCommand({
    DocumentLocation: {
      S3Object: {
        Bucket: bucketName,
        Name: s3Key,
      },
    },
  });

  const startResponse = await textractClient.send(startCommand);
  const jobId = startResponse.JobId;

  if (!jobId) {
    throw new Error("Textract did not return a job ID");
  }

  console.log(`Textract job started: ${jobId}`);

  // Poll until job completes (max ~2 minutes)
  const MAX_POLLS = 24;
  const POLL_INTERVAL_MS = 5000;

  let allBlocks: Block[] = [];

  for (let attempt = 0; attempt < MAX_POLLS; attempt++) {
    await new Promise((r) => setTimeout(r, POLL_INTERVAL_MS));

    const getCommand = new GetDocumentTextDetectionCommand({
      JobId: jobId,
    });

    const result = await textractClient.send(getCommand);

    if (result.JobStatus === "FAILED") {
      throw new Error(`Textract job failed: ${result.StatusMessage}`);
    }

    if (result.Blocks) {
      allBlocks = allBlocks.concat(result.Blocks);
    }

    if (result.JobStatus === "SUCCEEDED") {
      // Fetch any additional pages of results
      let nextToken = result.NextToken;
      while (nextToken) {
        const pageCommand = new GetDocumentTextDetectionCommand({
          JobId: jobId,
          NextToken: nextToken,
        });
        const pageResult = await textractClient.send(pageCommand);
        if (pageResult.Blocks) {
          allBlocks = allBlocks.concat(pageResult.Blocks);
        }
        nextToken = pageResult.NextToken;
      }

      console.log(`Textract job ${jobId} completed with ${allBlocks.length} blocks`);
      break;
    }

    if (attempt === MAX_POLLS - 1) {
      throw new Error("Textract job timed out after 2 minutes");
    }
  }

  const lines = allBlocks
    .filter((block: Block) => block.BlockType === "LINE")
    .map((block: Block) => block.Text || "")
    .filter((text) => text.trim().length > 0);

  const extractedText = lines.join("\n");
  console.log(`Extracted ${lines.length} lines across all pages`);

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
