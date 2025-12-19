import { Role } from "@prisma/client";
import { afterEach, describe, expect, it, vi } from "vitest";

import { auth } from "@/lib/auth";
import prisma from "@/lib/db";
import {
  LOCAL_URL_EXPIRATION_SECONDS,
  generateLocalSignature,
} from "@/lib/storage/local-signature";
import { POST as signDownload } from "./route";

vi.mock("@/lib/auth", () => ({
  auth: vi.fn(),
}));

vi.mock("@/lib/db", () => ({
  __esModule: true,
  default: {
    recording: { findFirst: vi.fn() },
  },
}));

const adminSession = {
  user: {
    id: "admin-1",
    email: "admin@example.com",
    name: "Admin",
    orgId: "org-1",
    role: Role.ADMIN,
  },
  expires: new Date(Date.now() + 60_000).toISOString(),
};

const originalEnv = { ...process.env };

afterEach(() => {
  vi.resetAllMocks();
  process.env = { ...originalEnv };
});

describe("/api/storage/sign-download", () => {
  it("retorna 403 quando a chave não pertence à organização do usuário", async () => {
    vi.mocked(auth).mockResolvedValue(adminSession as any);

    const response = await signDownload(
      new Request("http://localhost/api/storage/sign-download", {
        method: "POST",
        body: JSON.stringify({ key: "org/other-org/students/s1/recordings/file.webm" }),
      })
    );

    expect(response.status).toBe(403);
    await expect(response.json()).resolves.toEqual({
      error: "Chave não pertence à organização.",
    });
  });

  it("retorna uma URL assinada com expiração curta para o driver local", async () => {
    process.env.STORAGE_DRIVER = "local";
    process.env.NODE_ENV = "development";
    process.env.AUTH_SECRET = "local-secret";

    vi.mocked(auth).mockResolvedValue(adminSession as any);
    vi.mocked(prisma.recording.findFirst).mockResolvedValue({ id: "rec-1" } as any);

    const key = "org/org-1/students/s1/recordings/file.webm";
    const response = await signDownload(
      new Request("http://localhost/api/storage/sign-download", {
        method: "POST",
        body: JSON.stringify({ key }),
      })
    );

    expect(response.status).toBe(200);

    const { downloadUrl } = await response.json();
    const parsed = new URL(downloadUrl);
    const expires = Number(parsed.searchParams.get("expires"));
    const signature = parsed.searchParams.get("signature");

    expect(parsed.searchParams.get("key")).toBe(key);
    expect(Number.isFinite(expires)).toBe(true);
    expect(expires).toBeGreaterThan(Math.floor(Date.now() / 1000));
    expect(expires).toBeLessThanOrEqual(
      Math.floor(Date.now() / 1000) + LOCAL_URL_EXPIRATION_SECONDS + 1
    );
    expect(signature).toBe(generateLocalSignature(key, expires));
  });
});
