// utils/fileUpload.ts
// COMMON: handling of the files a page uploads (the attach popups: Ticket Sales, Refund, Service Charge Policy ...).
// A file comes from the page as base64 inside the JSON of the request; this file checks it and turns it into what the
// database needs. Every screen with an attach popup uses it, so the rules are the same everywhere:
//   - ANY type of file is accepted (pdf, doc, xls, jpeg, txt ...); only the SIZE is limited
//   - the file type stored is the extension without the dot, lower case, 5 characters at most
//   - the same size limits as the page (Frontend utils/fileUpload.ts: UPLOAD_MAX_FILE_BYTES / UPLOAD_MAX_TOTAL_BYTES)
//
// Usage (in a service):
//   const rows = cleanAttachRows(payload.attachRows);   // null = the popup was not used: nothing changes
//   for (const row of rows ?? []) { ... row.dox (Buffer), row.doxName, row.doxType, row.note, row.state ... }
import { fromBase64, getMime } from "./doxHelper";

export { getMime };

// The size limits. The request body of the server is 25 MB (server.ts) and a file travels as base64 (about 1/3 bigger), so
// these two stay well inside it. Keep the same two numbers in the Frontend (utils/fileUpload.ts).
export const UPLOAD_MAX_FILE_BYTES = 10 * 1024 * 1024; // one file
export const UPLOAD_MAX_TOTAL_BYTES = 15 * 1024 * 1024; // all the files of one save

// A rule of the upload that is broken (the controller / service sends it back as a 400).
export class UploadError extends Error {
  status = 400;
}

export const formatMB = (bytes: number) => `${Math.round(bytes / (1024 * 1024))} MB`;

// "report.PDF" / ".pdf" / "pdf" -> "pdf" (5 characters at most, as the file type column)
export const fileTypeOf = (value: unknown): string | null => {
  const text = typeof value === "string" ? value.trim() : "";
  const extension = text.includes(".") ? text.slice(text.lastIndexOf(".") + 1) : text;
  const type = extension.toLowerCase().slice(0, 5);
  return type === "" ? null : type;
};

// base64 (plain or a data URL) -> the bytes, after the size of the file is checked. null = no file.
export const decodeUpload = (value: unknown, maxFileBytes = UPLOAD_MAX_FILE_BYTES): Buffer | null => {
  const bytes = fromBase64(typeof value === "string" ? value : null);
  if (bytes && bytes.length > maxFileBytes) {
    throw new UploadError(`A file cannot be more than ${formatMB(maxFileBytes)}`);
  }
  return bytes;
};

export const checkUploadTotal = (totalBytes: number, maxTotalBytes = UPLOAD_MAX_TOTAL_BYTES) => {
  if (totalBytes > maxTotalBytes) {
    throw new UploadError(`The files of one save cannot be more than ${formatMB(maxTotalBytes)} together`);
  }
};

/* ---------------------------------------------------------------------
   The rows of an attach popup (the same rows for every screen)
   --------------------------------------------------------------------- */

// a row of the popup as the page sends it (the keys are the element ids of the popup, as everywhere in the project)
export type AttachRow = {
  txtAttachSlNo: number; // the line; 0 = a new line without a number: the service gives the next free one
  txtOriginalSlNo: number | null; // the line it was (modified / deleted rows)
  txtNote: string | null;
  txtDoxName: string | null; // File Name
  txtDoxType: string | null; // the extension of the file (pdf, jpeg ...)
  imgDox: Buffer | null; // the file; null = no new file (a modified line keeps its file)
  txtRowState: "added" | "modified" | "deleted";
};

const cleanText = (value: unknown, max: number, label: string): string | null => {
  const text = typeof value === "string" ? value.trim() : "";
  if (text === "") return null;
  if (text.length > max) throw new UploadError(`${label} can be ${max} characters at most`);
  return text;
};

const toSlNo = (value: unknown): number | null => {
  if (value === undefined || value === null || value === "" || value === 0) return null;
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed < 1 || parsed > 32000) throw new UploadError("Line is not valid");
  return parsed;
};

// The `attachRows` of a request: checked and turned into AttachRow. Not a list (the popup was not used) = null.
// Rows that did not change are left out.
export const cleanAttachRows = (
  raw: unknown,
  limits: { maxFileBytes?: number; maxTotalBytes?: number } = {},
): AttachRow[] | null => {
  if (!Array.isArray(raw)) return null;

  let total = 0;
  const rows: AttachRow[] = [];

  for (const item of raw) {
    const r = (item ?? {}) as Record<string, unknown>;
    const state = r.txtRowState;
    if (state !== "added" && state !== "modified" && state !== "deleted") continue;

    const imgDox = decodeUpload(r.imgDox, limits.maxFileBytes);
    total += imgDox?.length ?? 0;

    rows.push({
      txtAttachSlNo: toSlNo(r.txtAttachSlNo) ?? 0,
      txtOriginalSlNo: toSlNo(r.txtOriginalSlNo),
      txtNote: cleanText(r.txtNote, 100, "Note"),
      txtDoxName: cleanText(r.txtDoxName, 255, "File Name"),
      txtDoxType: fileTypeOf(r.txtDoxType),
      imgDox,
      txtRowState: state,
    });
  }

  checkUploadTotal(total, limits.maxTotalBytes);
  return rows;
};
