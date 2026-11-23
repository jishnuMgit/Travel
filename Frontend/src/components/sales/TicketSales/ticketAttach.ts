/* =====================================================================
   Ticket Sales - Customer Attach: the files of the ticket kept by the screen.
   The popup (HotelSalesAttachPage) only collects the files; they are sent WITH the ticket when it is saved / modified, as in
   the old form. Until then the screen keeps them here:
     fromDb = true   a file of the saved ticket (its content stays on the server; View reads it)
     fromDb = false  a file that was just attached (its content, base64, is kept until the ticket is saved)
     removed         a saved file that was removed in the popup (it is deleted when the ticket is saved)
     changed         a saved file whose note / name / file was changed
   ===================================================================== */
import type { AttachSavePayload } from "../../../pages/Travel/Setup/HotelSalesAttachPage";
import type { ServiceChargePolicyAttachment } from "../../../utils/ServiceChargePolicyApi";
import { mimeTypeOf } from "../../../utils/fileUpload";
import type { TicketAttachRowPayload, TicketAttachment } from "../../../utils/Api";

// the keys are the element ids of the popup (the same names as the payload and the response of the server)
export type AttachEntry = {
  txtAttachSlNo: number;
  txtNote: string | null;
  txtDoxName: string | null; // File Name
  txtDoxType: string | null;
  imgDox: string | null; // base64 of a file that was just attached; null for a saved file
  fromDb: boolean;
  changed: boolean;
  removed: boolean;
};

// the files of a loaded ticket
export const entriesFromLoaded = (items: TicketAttachment[] | undefined): AttachEntry[] =>
  (items ?? []).map((item) => ({
    txtAttachSlNo: item.txtAttachSlNo,
    txtNote: item.txtNote,
    txtDoxName: item.txtDoxName,
    txtDoxType: item.txtDoxType,
    imgDox: null,
    fromDb: true,
    changed: false,
    removed: false,
  }));

// what the popup shows: every file that is not removed (the popup component has its own column names: fSlNo, fNote ...)
export const popupAttachments = (entries: AttachEntry[]): ServiceChargePolicyAttachment[] =>
  entries
    .filter((entry) => !entry.removed)
    .sort((a, b) => a.txtAttachSlNo - b.txtAttachSlNo)
    .map((entry) => ({
      fSlNo: entry.txtAttachSlNo,
      fNote: entry.txtNote,
      fDoxName: entry.txtDoxName,
      fDoxType: entry.txtDoxType,
      mimeType: mimeTypeOf(entry.txtDoxName ?? ""),
      fDox: entry.imgDox,
    }));

// the popup was saved: what it changed is put into the entries
export const applyPopupPayload = (entries: AttachEntry[], rows: AttachSavePayload): AttachEntry[] => {
  let next = entries.map((entry) => ({ ...entry }));

  for (const row of rows) {
    const empty = !row.fDoxName && !row.fNote;

    // a new file
    if (row.originalSlNo === undefined) {
      if (!empty && row.rowState !== "deleted") {
        next.push({
          txtAttachSlNo: row.fSlNo,
          txtNote: row.fNote,
          txtDoxName: row.fDoxName,
          txtDoxType: row.fDoxType,
          imgDox: row.fDox,
          fromDb: false,
          changed: false,
          removed: false,
        });
      }
      continue;
    }

    const entry = next.find((e) => e.txtAttachSlNo === row.originalSlNo);
    if (!entry) continue;

    // removed (the popup sends an emptied line, or a deleted one)
    if (row.rowState === "deleted" || empty) {
      if (entry.fromDb) {
        entry.removed = true;
      } else {
        next = next.filter((e) => e !== entry);
      }
      continue;
    }

    entry.txtNote = row.fNote;
    entry.txtDoxName = row.fDoxName;
    entry.txtDoxType = row.fDoxType;
    if (row.fDox) entry.imgDox = row.fDox; // a new file replaces the old one
    if (entry.fromDb) entry.changed = true;
  }

  return next;
};

// what is sent with the ticket: the added, changed and removed files
export const attachPayload = (entries: AttachEntry[]): TicketAttachRowPayload[] => {
  const rows: TicketAttachRowPayload[] = [];

  for (const entry of entries) {
    if (!entry.fromDb) {
      if (!entry.removed) {
        rows.push({
          txtAttachSlNo: entry.txtAttachSlNo,
          txtNote: entry.txtNote,
          txtDoxName: entry.txtDoxName,
          txtDoxType: entry.txtDoxType,
          imgDox: entry.imgDox,
          txtRowState: "added",
        });
      }
    } else if (entry.removed) {
      rows.push({
        txtAttachSlNo: entry.txtAttachSlNo,
        txtOriginalSlNo: entry.txtAttachSlNo,
        txtNote: null,
        txtDoxName: null,
        txtDoxType: null,
        imgDox: null,
        txtRowState: "deleted",
      });
    } else if (entry.changed) {
      rows.push({
        txtAttachSlNo: entry.txtAttachSlNo,
        txtOriginalSlNo: entry.txtAttachSlNo,
        txtNote: entry.txtNote,
        txtDoxName: entry.txtDoxName,
        txtDoxType: entry.txtDoxType,
        imgDox: entry.imgDox, // null when only the note / name changed: the file stays
        txtRowState: "modified",
      });
    }
  }

  return rows;
};

// after the ticket is saved: every file is a saved file now (the content stays on the server)
export const entriesAfterSave = (entries: AttachEntry[]): AttachEntry[] =>
  entries
    .filter((entry) => !entry.removed)
    .map((entry) => ({ ...entry, imgDox: null, fromDb: true, changed: false, removed: false }));
