import { NextResponse } from "next/server";
import { z } from "zod";

import { Role } from "@prisma/client";

import { auth } from "@/lib/auth";
import prisma from "@/lib/db";
import { requireRole } from "@/lib/rbac";
import {
  ALLOWED_AUDIO_MIME_TYPES,
  extensionFromMimeType,
  isAllowedAudioMimeType,
} from "@/lib/upload-validation";

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

  try {
    requireRole(session, [Role.ADMIN, Role.TEACHER]);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Acesso negado.";
    return NextResponse.json({ error: message }, { status: 403 });
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
    requireRole(session, [Role.ADMIN, Role.TEACHER]);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Acesso negado.";
    return NextResponse.json({ error: message }, { status: 403 });
  }

  try {
    const body = await request.json();
    const parsed = recordingCreateSchema.safeParse(body);

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

    if (!isAllowedAudioMimeType(data.mimeType)) {
      return NextResponse.json(
        { error: "Tipo de arquivo não suportado." },
        { status: 415 }
      );
    }

    const expectedPrefix = `org/${session.user.orgId}/students/${data.studentId}/recordings/`;
    const expectedExtension = extensionFromMimeType(data.mimeType);
    const hasValidPrefix = data.storageKey.startsWith(expectedPrefix);
    const hasValidExtension = data.storageKey
      .toLowerCase()
      .endsWith(`.${expectedExtension}`);

    if (!hasValidPrefix || !hasValidExtension) {
      return NextResponse.json(
        { error: "Chave ou extensão incompatível com o tipo de arquivo." },
        { status: 415 }
      );
    }

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
