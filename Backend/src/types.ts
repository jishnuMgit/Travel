export type RowState = "added" | "modified" | "deleted" | "unchanged";

export interface AttachDto {
  fSlNo: number;
  fNote?: string | null;
  fDoxName?: string | null;
  fDoxType?: string | null;      // jpg, png, pdf ... (no dot, max 5 chars)
  fDox?: string | null;          // base64 string (data URL also accepted)
  originalSlNo?: number;         // needed for modified/deleted rows
  rowState?: RowState;
}

export interface AttachViewDto {
  fSlNo: number;
  fNote: string | null;
  fDoxName: string | null;
  fDoxType: string | null;
  mimeType: string;
  fDox: string | null;           // raw base64
}