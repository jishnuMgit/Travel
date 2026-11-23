// utils/fileUpload.ts
// COMMON: handling of the files a page uploads (the attach popups: Ticket Sales, Refund, Service Charge Policy ...).
// The backend has the same rules (Backend src/utils/fileUpload.ts); every attach popup / screen uses THIS file, so the
// limits and the reading of a file are the same everywhere:
//   - ANY type of file can be attached (pdf, doc, xls, jpeg, txt ...); only the SIZE is limited
//   - a file travels to the server as base64 inside the JSON of the save (fileToBase64)
//
// Usage:
//   const problem = checkUploadFile(file);                 // "" or the message to show
//   const base64 = await fileToBase64(file);
//   const blob = base64ToBlob(base64, file.name);          // to view a file that is not saved yet

// The size limits: the SAME two numbers as the backend (utils/fileUpload.ts). The server accepts a request of 25 MB and a
// file is sent as base64 (about 1/3 bigger), so these stay well inside it.
export const UPLOAD_MAX_FILE_BYTES = 10 * 1024 * 1024; // one file
export const UPLOAD_MAX_TOTAL_BYTES = 15 * 1024 * 1024; // all the files of one save

export const formatLimit = (bytes: number) => `${Math.round(bytes / (1024 * 1024))} MB`;

// "report.PDF" -> "pdf" ("" when there is no extension)
export const fileExtension = (fileName: string) => {
  const extensionStart = fileName.lastIndexOf(".");
  return extensionStart < 0 ? "" : fileName.slice(extensionStart + 1).toLowerCase();
};

// the message for a file that is too big, "" when it is fine
export const checkUploadFile = (file: { size: number }, maxFileBytes = UPLOAD_MAX_FILE_BYTES): string =>
  file.size > maxFileBytes ? `Attachment files cannot exceed ${formatLimit(maxFileBytes)}.` : "";

// the message for the files of one save that are too big together, "" when they are fine
export const checkUploadTotal = (totalBytes: number, maxTotalBytes = UPLOAD_MAX_TOTAL_BYTES): string =>
  totalBytes > maxTotalBytes ? `Combined attachment files cannot exceed ${formatLimit(maxTotalBytes)} per save.` : "";

// a file -> its content as base64 (without the "data:...;base64," prefix)
export const fileToBase64 = (file: File) =>
  new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result !== "string") {
        reject(new Error(`Unable to read ${file.name}.`));
        return;
      }
      const separator = reader.result.indexOf(",");
      if (separator < 0) {
        reject(new Error(`Unable to encode ${file.name}.`));
        return;
      }
      resolve(reader.result.slice(separator + 1));
    };
    reader.onerror = () => reject(reader.error ?? new Error(`Unable to read ${file.name}.`));
    reader.readAsDataURL(file);
  });

// the size in bytes of a base64 text
export const base64ByteSize = (value: string | null) => {
  if (!value) return 0;
  const prefixLength = value.indexOf("base64,");
  const encodedLength = value.length - (prefixLength >= 0 ? prefixLength + 7 : 0);
  const padding = value.endsWith("==") ? 2 : value.endsWith("=") ? 1 : 0;
  return Math.floor((encodedLength * 3) / 4) - padding;
};

// the content type of a file from its name ("" when it is not known): the preview shows images and pdf
export const mimeTypeOf = (fileName: string): string => {
  const extension = fileExtension(fileName);
  if (extension === "pdf") return "application/pdf";
  if (extension === "jpg" || extension === "jpeg") return "image/jpeg";
  if (["png", "gif", "bmp", "webp"].includes(extension)) return `image/${extension}`;
  return "";
};

// base64 -> a Blob (to view a file that is not saved yet)
export const base64ToBlob = (base64: string, fileName: string): Blob => {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);

  const type = mimeTypeOf(fileName);
  return new Blob([bytes], type ? { type } : undefined);
};
