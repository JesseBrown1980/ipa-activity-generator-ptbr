import { NextRequest, NextResponse } from "next/server";

import { Role } from "@prisma/client";

import { auth } from "@/lib/auth";
import { applyRateLimit, rateLimitPolicies } from "@/lib/rate-limit";
import { requireRole } from "@/lib/rbac";

export async function POST(request: NextRequest) {
  const limited = await applyRateLimit(request, rateLimitPolicies.planGeneration);
  if (limited) {
    return limited;
  }

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

  return NextResponse.json(
    { error: "Geração de planos ainda não está disponível neste ambiente." },
    { status: 501 }
  );
}
