export const ALLOWED_AUDIO_MIME_TYPES = [
  "audio/webm",
  "audio/wav",
  "audio/mpeg",
] as const;

export type AllowedAudioMimeType = (typeof ALLOWED_AUDIO_MIME_TYPES)[number];

export const MAX_AUDIO_FILE_BYTES = 10 * 1024 * 1024; // 10MB

export function isAllowedAudioMimeType(
  mimeType: string
): mimeType is AllowedAudioMimeType {
  return (ALLOWED_AUDIO_MIME_TYPES as readonly string[]).includes(mimeType);
}

export function formatAllowedMimeTypes() {
  return ALLOWED_AUDIO_MIME_TYPES.join(", ");
}

export function extensionFromMimeType(mimeType: AllowedAudioMimeType) {
  switch (mimeType) {
    case "audio/wav":
      return "wav";
    case "audio/mpeg":
      return "mp3";
    default:
      return "webm";
  }
}
