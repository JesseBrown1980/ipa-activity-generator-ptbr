import { NextRequest, NextResponse } from "next/server";

const DEFAULT_WINDOW_MS = 60_000;
const DEFAULT_MAX_REQUESTS = 5;

type MemoryEntry = {
  expiresAt: number;
  count: number;
};

const memoryStore = new Map<string, MemoryEntry>();

export type RateLimitPolicy = {
  /** Identificador legível para o recurso (ex.: "auth/login"). */
  identifier: string;
  /** Máximo de requisições dentro da janela. */
  maxRequests?: number;
  /** Janela em milissegundos. */
  windowMs?: number;
};

export function applyRateLimit(
  request: NextRequest,
  policy: RateLimitPolicy
): NextResponse | null {
  const windowMs = policy.windowMs ?? DEFAULT_WINDOW_MS;
  const maxRequests = policy.maxRequests ?? DEFAULT_MAX_REQUESTS;
  const now = Date.now();

  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0].trim() ||
    request.ip ||
    "unknown";

  const key = `${policy.identifier}:${ip}`;
  const entry = memoryStore.get(key);

  if (!entry || entry.expiresAt < now) {
    memoryStore.set(key, { count: 1, expiresAt: now + windowMs });
    return null;
  }

  if (entry.count >= maxRequests) {
    const retryAfterSeconds = Math.max(
      1,
      Math.ceil((entry.expiresAt - now) / 1000)
    );

    return NextResponse.json(
      {
        error: "Limite de requisições excedido. Tente novamente em instantes.",
      },
      {
        status: 429,
        headers: {
          "Retry-After": retryAfterSeconds.toString(),
          "X-RateLimit-Limit": maxRequests.toString(),
          "X-RateLimit-Remaining": "0",
          "X-RateLimit-Reset": Math.ceil(entry.expiresAt / 1000).toString(),
        },
      }
    );
  }

  entry.count += 1;
  memoryStore.set(key, entry);

  return null;
}

/**
 * Limpa o estado em memória, útil para testes que precisam de isolamento
 * entre cenários sem carregar o histórico de requisições anteriores.
 */
export function resetRateLimitStore() {
  memoryStore.clear();
}

/**
 * Para produção, habilite um limitador persistente baseado em Redis (ex.: Upstash)
 * sincronizando os contadores entre instâncias. O comportamento pode ser adaptado
 * usando o mesmo contrato de função acima, retornando uma resposta 429 quando o
 * limite for excedido e expondo cabeçalhos Retry-After e X-RateLimit-*.
 */
export const rateLimitPolicies = {
  login: { identifier: "auth/login", maxRequests: 10, windowMs: 10 * 60_000 },
  register: { identifier: "auth/register", maxRequests: 5, windowMs: 30 * 60_000 },
  planGeneration: {
    identifier: "plans/generate",
    maxRequests: 8,
    windowMs: 15 * 60_000,
  },
};
