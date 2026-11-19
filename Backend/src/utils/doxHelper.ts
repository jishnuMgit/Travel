const MIME_MAP: Record<string, string> = {
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  png: "image/png",
  gif: "image/gif",
  bmp: "image/bmp",
  webp: "image/webp",
  pdf: "application/pdf",
  txt: "text/plain",
  doc: "application/msword",
  docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  xls: "application/vnd.ms-excel",
  xlsx: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
};

export const getMime = (type?: string | null): string =>
  MIME_MAP[(type ?? "").trim().replace(/^\./, "").toLowerCase()] ??
  "application/octet-stream";

// accepts plain base64 or a full data URL -> Buffer (stored as bytea)
export const fromBase64 = (s?: string | null): Buffer | null => {
  if (!s || !s.trim()) return null;
  const i = s.toLowerCase().indexOf("base64,");
  if (i >= 0) s = s.slice(i + 7);
  return Buffer.from(s, "base64");
};