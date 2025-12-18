import { NextResponse } from "next/server";
import { Role } from "@prisma/client";

import { auth } from "@/lib/auth";
import prisma from "@/lib/db";
import { requireRole } from "@/lib/rbac";

export async function GET() {
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
    const plans = await prisma.plan.findMany({
      where: { orgId: session.user.orgId },
      orderBy: { createdAt: "desc" },
      include: {
        createdBy: {
          select: { id: true, email: true },
        },
      },
    });

    return NextResponse.json(plans, { status: 200 });
  } catch (error) {
    console.error("Erro ao listar planos", error);
    const message = error instanceof Error ? error.message : "Erro desconhecido.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
