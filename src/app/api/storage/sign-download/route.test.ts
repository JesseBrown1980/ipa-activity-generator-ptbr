import { Role } from "@prisma/client";
import { describe, expect, it, vi } from "vitest";

import { auth } from "@/lib/auth";
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
});
