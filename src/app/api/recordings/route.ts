import { NextResponse } from "next/server";
import { z } from "zod";

import { auth } from "@/lib/auth";
import prisma from "@/lib/db";
import { ALLOWED_AUDIO_MIME_TYPES } from "@/lib/upload-validation";

const recordingCreateSchema = z.object({
  storageKey: z.string().min(1),
  mimeType: z.enum(ALLOWED_AUDIO_MIME_TYPES),
  studentId: z.string().min(1),
  durationMs: z.number().int().positive().optional(),
});

const recordingListSchema = z.object({
  studentId: z.string().min(1).optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
});

export async function GET(request: Request) {
  const session = await auth();

  if (!session?.user?.id || !session.user.orgId) {
    return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
  }

  const url = new URL(request.url);
  const params = recordingListSchema.safeParse({
    studentId: url.searchParams.get("studentId") ?? undefined,
    startDate: url.searchParams.get("startDate") ?? undefined,
    endDate: url.searchParams.get("endDate") ?? undefined,
  });

  if (!params.success) {
    return NextResponse.json({ error: "Parâmetros inválidos." }, { status: 400 });
  }

  const startDate = params.data.startDate
    ? new Date(`${params.data.startDate}T00:00:00.000Z`)
    : null;
  const endDate = params.data.endDate
    ? new Date(`${params.data.endDate}T23:59:59.999Z`)
    : null;

  if ((startDate && Number.isNaN(startDate.getTime())) || (endDate && Number.isNaN(endDate.getTime()))) {
    return NextResponse.json({ error: "Datas inválidas." }, { status: 400 });
  }

  if (startDate && endDate && startDate > endDate) {
    return NextResponse.json({ error: "Intervalo de datas inválido." }, { status: 400 });
  }

  const recordings = await prisma.recording.findMany({
    where: {
      orgId: session.user.orgId,
      ...(params.data.studentId ? { studentId: params.data.studentId } : {}),
      ...(startDate ? { createdAt: { gte: startDate } } : {}),
      ...(endDate ? { createdAt: { lte: endDate } } : {}),
    },
    orderBy: { createdAt: "desc" },
    include: {
      student: {
        select: {
          id: true,
          code: true,
          displayName: true,
        },
      },
      createdBy: {
        select: {
          id: true,
          email: true,
        },
      },
    },
  });

  return NextResponse.json({ recordings });
}

export async function POST(request: Request) {
  const session = await auth();

  if (!session?.user?.id || !session.user.orgId) {
    return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
  }

  try {
    const body = await request.json();
    const data = recordingCreateSchema.parse(body);

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

    const recording = await prisma.recording.create({
      data: {
        orgId: session.user.orgId,
        studentId: data.studentId,
        createdByUserId: session.user.id,
        storageKey: data.storageKey,
        mimeType: data.mimeType,
        durationMs: data.durationMs,
      },
    });

    return NextResponse.json({ recording }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      const message = error.issues[0]?.message ?? "Dados inválidos.";
      return NextResponse.json({ error: message }, { status: 400 });
    }

    console.error("Erro ao registrar gravação", error);
    return NextResponse.json(
      { error: "Não foi possível salvar a gravação." },
      { status: 500 }
    );
  }
}
