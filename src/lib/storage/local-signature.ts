import { createHmac, timingSafeEqual } from "node:crypto";

export const LOCAL_URL_EXPIRATION_SECONDS = 60 * 5;

export function getLocalStorageSecret(): string {
  const secret = process.env.AUTH_SECRET;

  if (!secret) {
    throw new Error("AUTH_SECRET é obrigatório para assinar URLs de storage local.");
  }

  return secret;
}

export function generateLocalSignature(
  key: string,
  expires: number,
  secret = getLocalStorageSecret()
): string {
  return createHmac("sha256", secret).update(`${key}:${expires}`).digest("hex");
}

export function isLocalSignatureValid(
  key: string,
  expires: number,
  signature: string
): boolean {
  const secret = getLocalStorageSecret();
  const expectedSignature = generateLocalSignature(key, expires, secret);

  try {
    return timingSafeEqual(
      Buffer.from(signature, "utf8"),
      Buffer.from(expectedSignature, "utf8")
    );
  } catch (error) {
    console.error("Erro ao comparar assinatura local", error);
    return false;
  }
}
