import { Role } from "@prisma/client";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { auth } from "@/lib/auth";
import { POST as postConsent, PATCH as patchConsent } from "./route";

vi.mock("@/lib/auth", () => ({
  auth: vi.fn(),
}));

const studentFindFirst = vi.fn();
const consentCreate = vi.fn();
const consentUpdateMany = vi.fn();
const consentFindFirst = vi.fn();

vi.mock("@/lib/db", () => ({
  __esModule: true,
  default: {
    student: { findFirst: studentFindFirst },
    consent: {
      create: consentCreate,
      updateMany: consentUpdateMany,
      findFirst: consentFindFirst,
    },
  },
}));

const teacherSession = {
  user: {
    id: "teacher-1",
    email: "teacher@example.com",
    name: "Teacher",
    orgId: "org-1",
    role: Role.TEACHER,
  },
  expires: new Date(Date.now() + 60_000).toISOString(),
};

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

describe("/api/students/[id]/consent", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("retorna 403 quando o usuário não tem permissão para registrar consentimento", async () => {
    vi.mocked(auth).mockResolvedValue(teacherSession as any);

    const response = await postConsent(
      new Request("http://localhost/api/students/s1/consent", {
        method: "POST",
        body: JSON.stringify({ audioAllowed: true, shareForResearch: true }),
      }),
      { params: { id: "student-1" } }
    );

    expect(response.status).toBe(403);
    await expect(response.json()).resolves.toEqual({
      error: "Acesso negado para este perfil.",
    });
  });

  it("cria consentimento quando admin envia dados válidos", async () => {
    vi.mocked(auth).mockResolvedValue(adminSession as any);
    studentFindFirst.mockResolvedValue({ id: "student-1" });

    const createdConsent = {
      id: "consent-1",
      studentId: "student-1",
      audioAllowed: true,
      shareForResearch: false,
      signedAt: new Date("2024-01-01T00:00:00Z"),
      signedByUserId: "admin-1",
    } as const;

    consentCreate.mockResolvedValue(createdConsent);

    const response = await postConsent(
      new Request("http://localhost/api/students/s1/consent", {
        method: "POST",
        body: JSON.stringify({ audioAllowed: true, shareForResearch: false }),
      }),
      { params: { id: "student-1" } }
    );

    expect(studentFindFirst).toHaveBeenCalledWith({
      where: { id: "student-1", orgId: "org-1" },
      select: { id: true },
    });
    expect(consentCreate).toHaveBeenCalledWith({
      data: {
        studentId: "student-1",
        audioAllowed: true,
        shareForResearch: false,
        signedAt: expect.any(Date),
        signedByUserId: "admin-1",
      },
    });
    expect(response.status).toBe(201);
    await expect(response.json()).resolves.toEqual({ consent: createdConsent });
  });

  it("atualiza consentimento existente via PATCH", async () => {
    vi.mocked(auth).mockResolvedValue(adminSession as any);
    studentFindFirst.mockResolvedValue({ id: "student-1" });
    consentUpdateMany.mockResolvedValue({ count: 1 });

    const updatedConsent = {
      id: "consent-2",
      studentId: "student-1",
      audioAllowed: false,
      shareForResearch: true,
      signedAt: new Date("2024-02-02T00:00:00Z"),
      signedByUserId: "admin-1",
    } as const;

    consentFindFirst.mockResolvedValue(updatedConsent);

    const response = await patchConsent(
      new Request("http://localhost/api/students/s1/consent", {
        method: "PATCH",
        body: JSON.stringify({ audioAllowed: false, shareForResearch: true }),
      }),
      { params: { id: "student-1" } }
    );

    expect(consentUpdateMany).toHaveBeenCalledWith({
      where: { studentId: "student-1" },
      data: {
        audioAllowed: false,
        shareForResearch: true,
        signedAt: expect.any(Date),
        signedByUserId: "admin-1",
      },
    });
    expect(consentFindFirst).toHaveBeenCalledWith({
      where: { studentId: "student-1" },
      orderBy: { signedAt: "desc" },
    });
    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({ consent: updatedConsent });
  });
});
