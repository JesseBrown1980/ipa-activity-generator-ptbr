import { NextResponse } from "next/server";
import { z } from "zod";

import { Role } from "@prisma/client";

import { auth } from "@/lib/auth";
import prisma from "@/lib/db";
import { requireRole } from "@/lib/rbac";

const studentCreateSchema = z.object({
  displayName: z.string().max(120).optional(),
  notes: z.string().max(2000).optional(),
});

const searchSchema = z.object({
  search: z.string().max(120).optional(),
});

const CODE_CHARS = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

function generateStudentCode() {
  const length = 6 + Math.floor(Math.random() * 3);
  let code = "";

  for (let i = 0; i < length; i += 1) {
    const index = Math.floor(Math.random() * CODE_CHARS.length);
    code += CODE_CHARS[index];
  }

  return code;
}

async function generateUniqueStudentCode(orgId: string) {
  for (let attempts = 0; attempts < 10; attempts += 1) {
    const code = generateStudentCode();

    const existing = await prisma.student.findFirst({
      where: { orgId, code },
      select: { id: true },
    });

    if (!existing) {
      return code;
    }
  }

  throw new Error("Não foi possível gerar um código único para o estudante.");
}

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
  const parseResult = searchSchema.safeParse({
    search: url.searchParams.get("search") ?? undefined,
  });

  if (!parseResult.success) {
    return NextResponse.json({ error: "Parâmetros inválidos." }, { status: 400 });
  }

  const searchTerm = parseResult.data.search;

  const students = await prisma.student.findMany({
    where: {
      orgId: session.user.orgId,
      ...(searchTerm
        ? {
            OR: [
              { code: { contains: searchTerm, mode: "insensitive" } },
              { displayName: { contains: searchTerm, mode: "insensitive" } },
            ],
          }
        : {}),
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ students });
}

export async function POST(request: Request) {
  const session = await auth();

  if (!session?.user?.id || !session.user.orgId) {
    return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
  }

  try {
    requireRole(session, [Role.ADMIN]);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Acesso negado.";
    return NextResponse.json({ error: message }, { status: 403 });
  }

  try {
    const body = await request.json();
    const data = studentCreateSchema.parse(body);

    const code = await generateUniqueStudentCode(session.user.orgId);

    const student = await prisma.student.create({
      data: {
        orgId: session.user.orgId,
        code,
        displayName: data.displayName ?? "",
        notes: data.notes,
      },
    });

    return NextResponse.json({ student }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      const message = error.issues[0]?.message ?? "Dados inválidos.";
      return NextResponse.json({ error: message }, { status: 400 });
    }

    console.error("Erro ao criar estudante", error);
    return NextResponse.json(
      { error: "Não foi possível criar o estudante agora." },
      { status: 500 }
    );
  }
}
