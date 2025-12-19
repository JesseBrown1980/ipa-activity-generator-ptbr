import { NextResponse } from "next/server";
import { z } from "zod";

import { auth } from "@/lib/auth";
import prisma from "@/lib/db";
import { getStorageProvider } from "@/lib/storage";
import {
  LOCAL_URL_EXPIRATION_SECONDS,
  generateLocalSignature,
} from "@/lib/storage/local-signature";

const downloadSchema = z.object({
  key: z.string().min(1),
});

function keyMatchesOrg(key: string, orgId: string) {
  return key.startsWith(`org/${orgId}/`);
}

function buildLocalSignedDownloadUrl(baseUrl: string, key: string) {
  const url = new URL(baseUrl);

  // Garantimos que os parâmetros usados para validação estejam presentes e
  // recém-gerados, evitando links reutilizáveis por tempo indefinido.
  url.search = "";

  const expires =
    Math.floor(Date.now() / 1000) + LOCAL_URL_EXPIRATION_SECONDS;

  url.searchParams.set("key", key);
  url.searchParams.set("expires", expires.toString());
  url.searchParams.set("signature", generateLocalSignature(key, expires));

  return url.toString();
}

export async function POST(request: Request) {
  const session = await auth();

  if (!session?.user?.id || !session.user.orgId) {
    return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
  }

  try {
    const body = await request.json();
    const data = downloadSchema.parse(body);

    if (!keyMatchesOrg(data.key, session.user.orgId)) {
      return NextResponse.json(
        { error: "Chave não pertence à organização." },
        { status: 403 }
      );
    }

    const recording = await prisma.recording.findFirst({
      where: { orgId: session.user.orgId, storageKey: data.key },
      select: { id: true },
    });

    if (!recording) {
      return NextResponse.json(
        { error: "Gravação não encontrada para esta organização." },
        { status: 404 }
      );
    }

    const storage = getStorageProvider();
    const { url } = await storage.getSignedDownloadUrl({ key: data.key });

    const driver = process.env.STORAGE_DRIVER ?? "s3";
    const downloadUrl =
      driver === "local"
        ? buildLocalSignedDownloadUrl(url, data.key)
        : url;

    return NextResponse.json({ downloadUrl });
  } catch (error) {
    if (error instanceof z.ZodError) {
      const message = error.issues[0]?.message ?? "Dados inválidos.";
      return NextResponse.json({ error: message }, { status: 400 });
    }

    console.error("Erro ao gerar URL de download", error);
    return NextResponse.json(
      { error: "Não foi possível gerar a URL de download." },
      { status: 500 }
    );
  }
}
