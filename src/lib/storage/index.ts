import { GetObjectCommand, PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

export interface GetSignedUploadUrlParams {
  key: string;
  mimeType: string;
}

export interface GetSignedUploadUrlResult {
  url: string;
  headers?: Record<string, string>;
}

export interface GetSignedDownloadUrlParams {
  key: string;
}

export interface GetSignedDownloadUrlResult {
  url: string;
}

export interface StorageProvider {
  getSignedUploadUrl(
    params: GetSignedUploadUrlParams
  ): Promise<GetSignedUploadUrlResult>;
  getSignedDownloadUrl(
    params: GetSignedDownloadUrlParams
  ): Promise<GetSignedDownloadUrlResult>;
}

function createS3Provider(): StorageProvider {
  const bucket = process.env.S3_BUCKET;
  const region = process.env.S3_REGION;
  const endpoint = process.env.S3_ENDPOINT;
  const accessKeyId =
    process.env.S3_ACCESS_KEY_ID ?? process.env.AWS_ACCESS_KEY_ID;
  const secretAccessKey =
    process.env.S3_SECRET_ACCESS_KEY ?? process.env.AWS_SECRET_ACCESS_KEY;

  if (!bucket || !region || !accessKeyId || !secretAccessKey) {
    throw new Error(
      "Configuração do S3 ausente. Defina S3_BUCKET, S3_REGION e credenciais."
    );
  }

  const client = new S3Client({
    region,
    endpoint,
    forcePathStyle: Boolean(endpoint),
    credentials: {
      accessKeyId,
      secretAccessKey,
    },
  });

  return {
    async getSignedUploadUrl({ key, mimeType }) {
      const command = new PutObjectCommand({
        Bucket: bucket,
        Key: key,
        ContentType: mimeType,
      });

      const url = await getSignedUrl(client, command, { expiresIn: 900 });

      return { url };
    },
    async getSignedDownloadUrl({ key }) {
      const command = new GetObjectCommand({
        Bucket: bucket,
        Key: key,
      });

      const url = await getSignedUrl(client, command, { expiresIn: 900 });

      return { url };
    },
  } satisfies StorageProvider;
}

function createLocalProvider(): StorageProvider {
  const baseUrl =
    process.env.LOCAL_STORAGE_BASE_URL ?? "http://localhost:3000/storage";

  return {
    async getSignedUploadUrl({ key }) {
      const url = new URL(baseUrl);
      url.searchParams.set("key", key);

      return { url: url.toString() };
    },
    async getSignedDownloadUrl({ key }) {
      const url = new URL(baseUrl);
      url.searchParams.set("key", key);

      return { url: url.toString() };
    },
  } satisfies StorageProvider;
}

let cachedProvider: StorageProvider | null = null;

export function getStorageProvider(): StorageProvider {
  if (cachedProvider) {
    return cachedProvider;
  }

  if (process.env.STORAGE_DRIVER === "local") {
    cachedProvider = createLocalProvider();
    return cachedProvider;
  }

  try {
    cachedProvider = createS3Provider();
    return cachedProvider;
  } catch (error) {
    console.warn(
      "Falha ao configurar S3, utilizando driver local para desenvolvimento",
      error
    );
    cachedProvider = createLocalProvider();
    return cachedProvider;
  }
}
