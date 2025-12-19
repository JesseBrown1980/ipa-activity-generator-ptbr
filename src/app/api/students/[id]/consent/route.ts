import { NextResponse } from "next/server";
import { z } from "zod";

import { auth } from "@/lib/auth";
import prisma from "@/lib/db";
import { requireRole } from "@/lib/rbac";
import { Role } from "@prisma/client";

type RouteContext = {
  params: { id: string };
};

const consentSchema = z.object({
  audioAllowed: z.boolean(),
  shareForResearch: z.boolean(),
});

export async function GET(_request: Request, context: RouteContext) {
  const session = await auth();

  if (!session?.user?.id || !session.user.orgId) {
    return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
  }

  const student = await prisma.student.findFirst({
    where: { id: context.params.id, orgId: session.user.orgId },
    select: {
      id: true,
      consents: {
        orderBy: { signedAt: "desc" },
        take: 1,
        select: {
          id: true,
          audioAllowed: true,
          shareForResearch: true,
          signedAt: true,
        },
      },
    },
  });

  if (!student) {
    return NextResponse.json({ error: "Estudante não encontrado." }, { status: 404 });
  }

  const consent = student.consents[0]
    ? {
        id: student.consents[0].id,
        audioAllowed: student.consents[0].audioAllowed,
        shareForResearch: student.consents[0].shareForResearch,
        signedAt: student.consents[0].signedAt,
      }
    : null;

  return NextResponse.json({ consent });
}

export async function POST(request: Request, context: RouteContext) {
  const session = await auth();

  if (!session?.user?.id || !session.user.orgId) {
    return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
  }

  try {
    requireRole(session, [Role.ADMIN]);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Acesso negado para este perfil.";

    return NextResponse.json({ error: message }, { status: 403 });
  }

  try {
    const body = await request.json();
    const data = consentSchema.parse(body);

    const student = await prisma.student.findFirst({
      where: { id: context.params.id, orgId: session.user.orgId },
      select: { id: true },
    });

    if (!student) {
      return NextResponse.json(
        { error: "Estudante não encontrado." },
        { status: 404 }
      );
    }

    const consent = await prisma.consent.create({
      data: {
        studentId: student.id,
        audioAllowed: data.audioAllowed,
        shareForResearch: data.shareForResearch,
        signedAt: new Date(),
        signedByUserId: session.user.id,
      },
    });

    return NextResponse.json({ consent }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      const message = error.issues[0]?.message ?? "Dados inválidos.";
      return NextResponse.json({ error: message }, { status: 400 });
    }

    console.error("Erro ao registrar consentimento", error);
    return NextResponse.json(
      { error: "Não foi possível registrar o consentimento." },
      { status: 500 }
    );
  }
}

export async function PATCH(request: Request, context: RouteContext) {
  const session = await auth();

  if (!session?.user?.id || !session.user.orgId) {
    return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
  }

  try {
    requireRole(session, [Role.ADMIN]);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Acesso negado para este perfil.";

    return NextResponse.json({ error: message }, { status: 403 });
  }

  try {
    const body = await request.json();
    const data = consentSchema.parse(body);

    const student = await prisma.student.findFirst({
      where: { id: context.params.id, orgId: session.user.orgId },
      select: { id: true },
    });

    if (!student) {
      return NextResponse.json(
        { error: "Estudante não encontrado." },
        { status: 404 }
      );
    }

    const result = await prisma.consent.updateMany({
      where: { studentId: student.id },
      data: {
        audioAllowed: data.audioAllowed,
        shareForResearch: data.shareForResearch,
        signedAt: new Date(),
        signedByUserId: session.user.id,
      },
    });

    const consent =
      result.count > 0
        ? await prisma.consent.findFirst({
            where: { studentId: student.id },
            orderBy: { signedAt: "desc" },
          })
        : await prisma.consent.create({
            data: {
              studentId: student.id,
              audioAllowed: data.audioAllowed,
              shareForResearch: data.shareForResearch,
              signedAt: new Date(),
              signedByUserId: session.user.id,
            },
          });

    return NextResponse.json({ consent });
  } catch (error) {
    if (error instanceof z.ZodError) {
      const message = error.issues[0]?.message ?? "Dados inválidos.";
      return NextResponse.json({ error: message }, { status: 400 });
    }

    console.error("Erro ao atualizar consentimento", error);
    return NextResponse.json(
      { error: "Não foi possível atualizar o consentimento." },
      { status: 500 }
    );
  }
}
