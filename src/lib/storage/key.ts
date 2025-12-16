import { randomUUID } from "crypto";

import { extensionFromMimeType, type AllowedAudioMimeType } from "../upload-validation";

interface RecordingKeyParams {
  orgId: string;
  studentId: string;
  mimeType: AllowedAudioMimeType;
  now?: () => number;
  uuid?: () => string;
}

export function generateRecordingStorageKey({
  orgId,
  studentId,
  mimeType,
  now = Date.now,
  uuid = randomUUID,
}: RecordingKeyParams) {
  const timestamp = now();
  const uniqueId = uuid().replace(/-/g, "");
  const extension = extensionFromMimeType(mimeType);

  return `org/${orgId}/students/${studentId}/recordings/${timestamp}_${uniqueId}.${extension}`;
}
