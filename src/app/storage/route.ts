import { NextRequest } from "next/server";
import { extname } from "node:path";

import {
  isLocalSignatureValid,
  getLocalStorageSecret,
} from "@/lib/storage/local-signature";

type StoredObject = {
  data: Uint8Array;
  contentType: string;
};

type GlobalStorage = typeof globalThis & {
  __IN_MEMORY_STORAGE__?: Map<string, StoredObject>;
};

const getInMemoryStorage = (): Map<string, StoredObject> => {
  const globalScope = globalThis as GlobalStorage;

  if (!globalScope.__IN_MEMORY_STORAGE__) {
    globalScope.__IN_MEMORY_STORAGE__ = new Map<string, StoredObject>();
  }

  return globalScope.__IN_MEMORY_STORAGE__;
};

const inferMimeType = (key: string): string => {
  const extension = extname(key).toLowerCase();

  switch (extension) {
    case ".webm":
      return "audio/webm";
    case ".mp3":
      return "audio/mpeg";
    case ".wav":
      return "audio/wav";
    case ".ogg":
      return "audio/ogg";
    default:
      return "application/octet-stream";
  }
};

const isRequestAuthorized = (
  request: NextRequest
): { authorized: boolean; key?: string; expires?: number } => {
  const key = request.nextUrl.searchParams.get("key");
  const expiresParam = request.nextUrl.searchParams.get("expires");
  const signature = request.nextUrl.searchParams.get("signature");

  if (!key || !expiresParam || !signature) {
    return { authorized: false };
  }

  const expires = Number(expiresParam);
  const now = Math.floor(Date.now() / 1000);

  if (!Number.isFinite(expires) || expires < now) {
    return { authorized: false };
  }

  // Garantir que o segredo existe em ambiente local
  getLocalStorageSecret();

  if (!isLocalSignatureValid(key, expires, signature)) {
    return { authorized: false };
  }

  return { authorized: true, key, expires };
};

export async function PUT(request: NextRequest) {
  const auth = isRequestAuthorized(request);

  if (!auth.authorized || !auth.key) {
    return new Response("Assinatura inválida ou expirada", { status: 403 });
  }

  const body = new Uint8Array(await request.arrayBuffer());
  const storage = getInMemoryStorage();
  const contentType =
    request.headers.get("content-type") ?? inferMimeType(auth.key);

  storage.set(auth.key, { data: body, contentType });

  return new Response(null, { status: 200 });
}

export async function GET(request: NextRequest) {
  const auth = isRequestAuthorized(request);

  if (!auth.authorized || !auth.key) {
    return new Response("Assinatura inválida ou expirada", { status: 403 });
  }

  const storage = getInMemoryStorage();
  const storedObject = storage.get(auth.key);

  if (!storedObject) {
    return new Response("Arquivo não encontrado", { status: 404 });
  }

  return new Response(storedObject.data, {
    status: 200,
    headers: {
      "Content-Type": storedObject.contentType || inferMimeType(auth.key),
      "Cache-Control": "no-store",
    },
  });
}
