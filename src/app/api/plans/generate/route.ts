import { NextRequest, NextResponse } from "next/server";

import { applyRateLimit, rateLimitPolicies } from "@/lib/rate-limit";

export async function POST(request: NextRequest) {
  const limited = applyRateLimit(request, rateLimitPolicies.planGeneration);
  if (limited) {
    return limited;
  }

  return NextResponse.json(
    { error: "Geração de planos ainda não está disponível neste ambiente." },
    { status: 501 }
  );
}
