import { NextRequest } from "next/server";

import { handlers } from "@/lib/auth";
import { applyRateLimit, rateLimitPolicies } from "@/lib/rate-limit";

export async function POST(request: NextRequest) {
  const limited = await applyRateLimit(request, rateLimitPolicies.login);
  if (limited) {
    return limited;
  }

  return handlers.POST(request);
}

export const GET = handlers.GET;
