import { NextResponse } from "next/server";

import { auth } from "@/lib/auth";
import prisma from "@/lib/db";

type RouteContext = {
  params: { id: string };
};

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
        select: { id: true, audioAllowed: true, signedAt: true },
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
        signedAt: student.consents[0].signedAt,
      }
    : null;

  return NextResponse.json({ consent });
}
