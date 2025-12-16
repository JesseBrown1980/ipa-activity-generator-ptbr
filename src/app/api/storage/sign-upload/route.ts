import { randomUUID } from "crypto";
import { NextResponse } from "next/server";
import { z } from "zod";

import { auth } from "@/lib/auth";
import prisma from "@/lib/db";
import { getStorageProvider } from "@/lib/storage";

const uploadSchema = z.object({
  mimeType: z.string().min(1),
  studentId: z.string().min(1),
});

function buildObjectKey(orgId: string, studentId: string) {
  const timestamp = Date.now();
  const uniqueId = randomUUID().replace(/-/g, "");

  return `org/${orgId}/students/${studentId}/recordings/${timestamp}_${uniqueId}.webm`;
}

export async function POST(request: Request) {
  const session = await auth();

  if (!session?.user?.id || !session.user.orgId) {
    return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
  }

  try {
    const body = await request.json();
    const data = uploadSchema.parse(body);

    const student = await prisma.student.findFirst({
      where: { id: data.studentId, orgId: session.user.orgId },
      select: { id: true },
    });

    if (!student) {
      return NextResponse.json(
        { error: "Estudante não encontrado." },
        { status: 404 }
      );
    }

    const key = buildObjectKey(session.user.orgId, data.studentId);
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
