import { describe, expect, it } from "vitest";

import { generateRecordingStorageKey } from "./key";

const fixedNow = () => 1_725_000_000_000;
const fixedUuid = () => "ed9af51a-daae-4cbb-ab33-6159c9d9b822";

describe("generateRecordingStorageKey", () => {
  it("monta a rota de armazenamento com contexto de organização e estudante", () => {
    const key = generateRecordingStorageKey({
      orgId: "org-123",
      studentId: "student-456",
      mimeType: "audio/wav",
      now: fixedNow,
      uuid: fixedUuid,
    });

    expect(key).toBe(
      "org/org-123/students/student-456/recordings/1725000000000_ed9af51adaae4cbbab336159c9d9b822.wav"
    );
  });

  it("normaliza UUID removendo hífens e usa extensão correta", () => {
    const mp3Key = generateRecordingStorageKey({
      orgId: "org-1",
      studentId: "student-1",
      mimeType: "audio/mpeg",
      now: () => 123,
      uuid: () => "abc-def",
    });

    expect(mp3Key.endsWith("123_abcdef.mp3")).toBe(true);
  });
});
