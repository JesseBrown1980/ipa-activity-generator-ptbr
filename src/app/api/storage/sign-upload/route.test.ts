import { Role } from "@prisma/client";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { auth } from "@/lib/auth";
import { generateRecordingStorageKey } from "@/lib/storage/key";
import { POST as signUpload } from "./route";

vi.mock("@/lib/auth", () => ({
  auth: vi.fn(),
}));

const studentFindFirst = vi.fn();
const getSignedUploadUrl = vi.fn();

vi.mock("@/lib/db", () => ({
  __esModule: true,
  default: {
    student: { findFirst: studentFindFirst },
  },
}));

vi.mock("@/lib/storage", () => ({
  __esModule: true,
  getStorageProvider: () => ({
    getSignedUploadUrl,
  }),
}));

vi.mock("@/lib/storage/key", () => ({
  __esModule: true,
  generateRecordingStorageKey: vi.fn().mockReturnValue("org/org-1/students/student-1/recordings/test.webm"),
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

describe("/api/storage/sign-upload", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("nega upload quando não há consentimento de áudio", async () => {
    vi.mocked(auth).mockResolvedValue(teacherSession as any);
    studentFindFirst.mockResolvedValue({ id: "student-1", consents: [] });

    const response = await signUpload(
      new Request("http://localhost/api/storage/sign-upload", {
        method: "POST",
        body: JSON.stringify({
          mimeType: "audio/webm",
          studentId: "student-1",
          sizeBytes: 1024,
        }),
      })
    );

    expect(studentFindFirst).toHaveBeenCalled();
    expect(response.status).toBe(403);
    await expect(response.json()).resolves.toEqual({
      error: "Consentimento de áudio não encontrado ou negado.",
    });
    expect(getSignedUploadUrl).not.toHaveBeenCalled();
  });

  it("gera URL de upload quando há consentimento válido", async () => {
    vi.mocked(auth).mockResolvedValue(teacherSession as any);
    studentFindFirst.mockResolvedValue({
      id: "student-1",
      consents: [{ audioAllowed: true }],
    });
    getSignedUploadUrl.mockResolvedValue({ url: "http://upload.example.com" });

    const response = await signUpload(
      new Request("http://localhost/api/storage/sign-upload", {
        method: "POST",
        body: JSON.stringify({
          mimeType: "audio/webm",
          studentId: "student-1",
          sizeBytes: 2048,
        }),
      })
    );

    expect(generateRecordingStorageKey).toHaveBeenCalledWith({
      orgId: "org-1",
      studentId: "student-1",
      mimeType: "audio/webm",
    });
    expect(getSignedUploadUrl).toHaveBeenCalledWith({
      key: "org/org-1/students/student-1/recordings/test.webm",
      mimeType: "audio/webm",
    });
    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      key: "org/org-1/students/student-1/recordings/test.webm",
      uploadUrl: "http://upload.example.com",
    });
  });
});
