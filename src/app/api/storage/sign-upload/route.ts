import { NextResponse } from "next/server";
import { z } from "zod";

import { auth } from "@/lib/auth";
import prisma from "@/lib/db";
import { getStorageProvider } from "@/lib/storage";
import {
  ALLOWED_AUDIO_MIME_TYPES,
  MAX_AUDIO_FILE_BYTES,
} from "@/lib/upload-validation";
import { generateRecordingStorageKey } from "@/lib/storage/key";

const uploadSchema = z.object({
  mimeType: z.enum(ALLOWED_AUDIO_MIME_TYPES),
  studentId: z.string().min(1),
  sizeBytes: z
    .number()
    .int()
    .positive()
    .max(MAX_AUDIO_FILE_BYTES, {
      message: "Arquivo de áudio excede o limite permitido.",
    }),
});

export async function POST(request: Request) {
  const session = await auth();

  if (!session?.user?.id || !session.user.orgId) {
    return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
  }

  try {
    const body = await request.json();
    const parsed = uploadSchema.safeParse(body);

    if (!parsed.success) {
      const message = parsed.error.issues[0]?.message ?? "Dados inválidos.";
      const status = parsed.error.issues.some((issue) =>
        issue.path.includes("mimeType")
      )
        ? 415
        : 400;

      return NextResponse.json({ error: message }, { status });
    }

    const data = parsed.data;

    const student = await prisma.student.findFirst({
      where: { id: data.studentId, orgId: session.user.orgId },
      select: {
        id: true,
        consents: {
          orderBy: { signedAt: "desc" },
          take: 1,
          select: { audioAllowed: true },
        },
      },
    });

    if (!student) {
      return NextResponse.json(
        { error: "Estudante não encontrado." },
        { status: 404 }
      );
    }

    const latestConsent = student.consents[0];

    if (!latestConsent?.audioAllowed) {
      return NextResponse.json(
        { error: "Consentimento de áudio não encontrado ou negado." },
        { status: 403 }
      );
    }

    const key = generateRecordingStorageKey({
      orgId: session.user.orgId,
      studentId: data.studentId,
      mimeType: data.mimeType,
    });
    const storage = getStorageProvider();
    const upload = await storage.getSignedUploadUrl({
      key,
      mimeType: data.mimeType,
    });

    return NextResponse.json({
      key,
      uploadUrl: upload.url,
      ...(upload.headers ? { headers: upload.headers } : {}),
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      const message = error.issues[0]?.message ?? "Dados inválidos.";
      return NextResponse.json({ error: message }, { status: 400 });
    }

    console.error("Erro ao gerar URL de upload", error);
    return NextResponse.json(
      { error: "Não foi possível gerar a URL de upload." },
      { status: 500 }
    );
  }
}
