import { NextResponse } from "next/server";
import { z } from "zod";

import { auth } from "@/lib/auth";
import prisma from "@/lib/db";

const studentUpdateSchema = z.object({
  displayName: z.string().max(120).optional(),
  notes: z.string().max(2000).nullable().optional(),
});

export async function GET(
  _request: Request,
  { params }: { params: { id: string } }
) {
  const session = await auth();

  if (!session?.user?.id || !session.user.orgId) {
    return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
  }

  const student = await prisma.student.findFirst({
    where: { id: params.id, orgId: session.user.orgId },
  });

  if (!student) {
    return NextResponse.json({ error: "Estudante não encontrado." }, { status: 404 });
  }

  return NextResponse.json({ student });
}

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  const session = await auth();

  if (!session?.user?.id || !session.user.orgId) {
    return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
  }

  try {
    const body = await request.json();
    const data = studentUpdateSchema.parse(body);

    const student = await prisma.student.findFirst({
      where: { id: params.id, orgId: session.user.orgId },
      select: { id: true },
    });

    if (!student) {
      return NextResponse.json(
        { error: "Estudante não encontrado." },
        { status: 404 }
      );
    }

    const updatedStudent = await prisma.student.update({
      where: { id: params.id },
      data: {
        displayName: data.displayName ?? undefined,
        notes: data.notes ?? undefined,
      },
    });

    return NextResponse.json({ student: updatedStudent });
  } catch (error) {
    if (error instanceof z.ZodError) {
      const message = error.issues[0]?.message ?? "Dados inválidos.";
      return NextResponse.json({ error: message }, { status: 400 });
    }

    console.error("Erro ao atualizar estudante", error);
    return NextResponse.json(
      { error: "Não foi possível atualizar o estudante." },
      { status: 500 }
    );
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: { id: string } }
) {
  const session = await auth();

  if (!session?.user?.id || !session.user.orgId) {
    return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
  }

  const student = await prisma.student.findFirst({
    where: { id: params.id, orgId: session.user.orgId },
    select: { id: true },
  });

  if (!student) {
    return NextResponse.json({ error: "Estudante não encontrado." }, { status: 404 });
  }

  await prisma.student.delete({ where: { id: params.id } });

  return NextResponse.json({ ok: true });
}
