import React, { useEffect, useMemo, useRef, useState } from "react";
import Header from "../../../components/common/Header";
import { MdAttachFile, MdClose, MdVisibility } from "react-icons/md";
import { toast } from "react-toastify";
import { useConfirmModal } from "../../../hooks/useConfirmModal";
import {
  base64ByteSize,
  checkUploadFile,
  checkUploadTotal,
  fileExtension,
  fileToBase64,
  mimeTypeOf,
} from "../../../utils/fileUpload";
import type {
  ServiceChargePolicyAttachment,
  ServiceChargePolicyAttachmentSave,
} from "../../../utils/ServiceChargePolicyApi";

type AttachRow = {
  key: number;
  file: File | null;
  fileName: string;
  previewUrl: string | null;
  previewBlob: Blob | null;
  note: string;
  storedDox: string | null;
  original: ServiceChargePolicyAttachment | null;
  rowState: "added" | "modified" | "unchanged";
};

export type AttachSavePayload = ServiceChargePolicyAttachmentSave[];

type HotelSalesAttachPageProps = {
  headerName?: string;
  onClose?: () => void;
  attachments?: ServiceChargePolicyAttachment[];
  loadAttachmentFile?: (slNo: number) => Promise<Blob>;
  onSave?: (rows: AttachSavePayload) => void | Promise<void>;
  /** the size limits (bytes): one file, and all the files of one save; the default is 250 MB for both */
  maxFileBytes?: number;
  maxTotalBytes?: number;
  /** the message after Save (default "Saved successfully") */
  saveMessage?: string;
  /** the File Name can be typed / changed (default: it is only filled when a file is chosen) */
  fileNameEditable?: boolean;
  /** a new empty line is added whenever every line has a file or a note (default: the 6 lines stay as they are) */
  autoAddRow?: boolean;
  /** removing a file asks "Do you want to delete line n?" first (default: it is removed at once) */
  confirmRemove?: boolean;
  /** confirmRemove: called when Yes is clicked, with the saved line (null = a line that is not saved); it deletes it from the database; an error keeps the line */
  onRemoveLine?: (line: ServiceChargePolicyAttachment | null) => void | Promise<void>;
  /** as the Sales Conjunction popup: closing the popup (x / Esc) also keeps what was changed (given to onSave) */
  saveOnClose?: boolean;
};

const MIN_ROWS = 6;
const MAX_SAVE_BYTES = 250 * 1024 * 1024;
const MAX_TEXT_PREVIEW_BYTES = 1024 * 1024;
const MAX_SPREADSHEET_PREVIEW_BYTES = 50 * 1024 * 1024;
let keyCounter = 0;
const nextKey = () => ++keyCounter;

const emptyRow = (): AttachRow => ({
  key: nextKey(),
  file: null,
  fileName: "",
  previewUrl: null,
  previewBlob: null,
  note: "",
  storedDox: null,
  original: null,
  rowState: "added",
});

const isEmptyRow = (row: AttachRow) =>
  !row.fileName && !row.note.trim();

const initialRows = (
  attachments: ServiceChargePolicyAttachment[],
): AttachRow[] => [
  ...attachments.map((attachment) => ({
    key: nextKey(),
    file: null,
    fileName: attachment.fDoxName ?? "",
    previewUrl: null,
    previewBlob: null,
    note: attachment.fNote ?? "",
    storedDox: attachment.fDox,
    original: attachment,
    rowState: "unchanged" as const,
  })),
  ...Array.from(
    { length: Math.max(MIN_ROWS - attachments.length, 1) },
    emptyRow,
  ),
];

const niceScrollbar = [
  "[&::-webkit-scrollbar]:h-2.5",
  "[&::-webkit-scrollbar]:w-2.5",
  "[&::-webkit-scrollbar-track]:bg-[#f2f8f4]",
  "[&::-webkit-scrollbar-thumb]:rounded-full",
  "[&::-webkit-scrollbar-thumb]:border-2",
  "[&::-webkit-scrollbar-thumb]:border-solid",
  "[&::-webkit-scrollbar-thumb]:border-[#f2f8f4]",
  "[&::-webkit-scrollbar-thumb]:bg-[#9fdfbc]",
  "[&::-webkit-scrollbar-thumb:hover]:bg-[#64d96e]",
  "[&::-webkit-scrollbar-thumb:active]:bg-[#4cc45a]",
  "[&::-webkit-scrollbar-corner]:bg-[#f2f8f4]",
].join(" ");

const thClass =
  "h-[30px] border border-[#B7ECD0] bg-[#E7F7ED] px-2 font-normal text-[#405066]";

const isImage = (row: AttachRow) =>
  row.file?.type.startsWith("image/") ||
  row.original?.mimeType.startsWith("image/") ||
  mimeTypeOf(row.fileName).startsWith("image/");
const isPdf = (row: AttachRow) =>
  row.file?.type === "application/pdf" ||
  row.original?.mimeType === "application/pdf" ||
  row.fileName.toLowerCase().endsWith(".pdf");
const isTextFile = (row: AttachRow) =>
  row.file?.type.startsWith("text/") ||
  ["txt", "csv", "tsv", "log", "json", "xml"].includes(
    fileExtension(row.fileName),
  );
const isExcelFile = (row: AttachRow) =>
  [".xlsx", ".xlsm"].some((extension) =>
    row.fileName.toLowerCase().endsWith(extension),
  );

const parseExcelPreview = (
  data: ArrayBuffer,
): Promise<{ sheetName: string; rows: string[][]; truncated: boolean }> =>
  new Promise((resolve, reject) => {
    const worker = new Worker(
      new URL("./ExcelPreviewWorker.ts", import.meta.url),
      { type: "module" },
    );
    const timeoutId = window.setTimeout(() => {
      worker.terminate();
      reject(new Error("Excel preview timed out. Download the workbook to view it."));
    }, 60_000);

    worker.onmessage = (event: MessageEvent<
      | { success: true; sheetName: string; rows: string[][]; truncated: boolean }
      | { success: false; message: string }
    >) => {
      window.clearTimeout(timeoutId);
      worker.terminate();
      if (event.data.success) {
        resolve(event.data);
      } else {
        reject(new Error(event.data.message));
      }
    };
    worker.onerror = (event) => {
      window.clearTimeout(timeoutId);
      worker.terminate();
      reject(new Error(event.message || "Unable to preview this workbook."));
    };
    worker.postMessage(data, [data]);
  });

const HotelSalesAttachPage: React.FC<HotelSalesAttachPageProps> = ({
  headerName = "Attach",
  onClose,
  attachments = [],
  loadAttachmentFile,
  onSave,
  maxFileBytes = MAX_SAVE_BYTES,
  maxTotalBytes = MAX_SAVE_BYTES,
  saveMessage = "Saved successfully",
  fileNameEditable = false,
  autoAddRow = false,
  confirmRemove = false,
  onRemoveLine,
  saveOnClose = false,
}) => {
  const { confirm, dialog } = useConfirmModal();
  const confirmingRef = useRef(false);
  const [rows, setRows] = useState<AttachRow[]>(() => initialRows(attachments));
  const [selectedKey, setSelectedKey] = useState<number | null>(rows[0]?.key ?? null);
  const [previewRow, setPreviewRow] = useState<AttachRow | null>(null);
  const [previewContent, setPreviewContent] = useState<
    | { kind: "text"; text: string; truncated: boolean }
    | { kind: "spreadsheet"; sheetName: string; rows: string[][]; truncated: boolean }
    | { kind: "message"; message: string }
    | null
  >(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  // saved lines that were deleted in this popup (the line is gone from the list; it is deleted when the ticket is saved)
  const [deletedLines, setDeletedLines] = useState<ServiceChargePolicyAttachment[]>([]);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const pickingKeyRef = useRef<number | null>(null);
  const urlsRef = useRef<Set<string>>(new Set());

  // Release every object URL when the page unmounts.
  useEffect(() => {
    const urls = urlsRef.current;
    return () => {
      urls.forEach((url) => URL.revokeObjectURL(url));
      urls.clear();
    };
  }, []);

  // every line is used: a new empty one is added
  useEffect(() => {
    if (autoAddRow && !rows.some((row) => isEmptyRow(row))) {
      setRows((previous) => [...previous, emptyRow()]);
    }
  }, [autoAddRow, rows]);

  const firstEmptyKey = useMemo(
    () => rows.find((row) => isEmptyRow(row))?.key ?? null,
    [rows],
  );

  const releaseUrl = (url: string | null) => {
    if (!url || !urlsRef.current.has(url)) return;
    URL.revokeObjectURL(url);
    urlsRef.current.delete(url);
  };

  const openFilePicker = (row: AttachRow) => {
    pickingKeyRef.current = row.key;
    setSelectedKey(row.key);
    fileInputRef.current?.click();
  };

  const openPreview = async (row: AttachRow) => {
    setSelectedKey(row.key);
    setPreviewRow(row);
    setPreviewLoading(true);
    try {
      const blob =
        row.previewBlob ??
        row.file ??
        (row.original && loadAttachmentFile
          ? await loadAttachmentFile(row.original.fSlNo)
          : null);
      if (!blob) throw new Error("Unable to load the attachment preview.");

      let previewUrl = row.previewUrl;
      if (!previewUrl) {
        previewUrl = URL.createObjectURL(blob);
        urlsRef.current.add(previewUrl);
      }

      if (isTextFile(row)) {
        const truncated = blob.size > MAX_TEXT_PREVIEW_BYTES;
        const text = await blob
          .slice(0, MAX_TEXT_PREVIEW_BYTES)
          .text();
        setPreviewContent({ kind: "text", text, truncated });
      } else if (isExcelFile(row)) {
        if (blob.size > MAX_SPREADSHEET_PREVIEW_BYTES) {
          setPreviewContent({
            kind: "message",
            message: "This workbook is too large to preview. Download it to view the contents.",
          });
        } else {
          try {
            const result = await parseExcelPreview(await blob.arrayBuffer());
            setPreviewContent({
              kind: "spreadsheet",
              sheetName: result.sheetName,
              rows: result.rows,
              truncated: result.truncated,
            });
          } catch (previewError) {
            setPreviewContent({
              kind: "message",
              message:
                previewError instanceof Error
                  ? previewError.message
                  : "Unable to preview this workbook. Download it to view the contents.",
            });
          }
        }
      } else if (row.fileName.toLowerCase().endsWith(".xls")) {
        setPreviewContent({
          kind: "message",
          message: "Legacy .xls files cannot be previewed here. Download the file to view it.",
        });
      } else {
        setPreviewContent(null);
      }

      setRows((currentRows) =>
        currentRows.map((currentRow) =>
          currentRow.key === row.key
            ? { ...currentRow, previewUrl, previewBlob: blob }
            : currentRow,
        ),
      );
      setPreviewRow({ ...row, previewUrl, previewBlob: blob });
    } catch (previewError) {
      toast.error(
        previewError instanceof Error
          ? previewError.message
          : "Unable to load the attachment preview.",
      );
    } finally {
      setPreviewLoading(false);
    }
  };

  const handleFileChosen = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0] ?? null;
    const key = pickingKeyRef.current;
    event.target.value = "";
    pickingKeyRef.current = null;
    if (!file || key === null) return;
    const fileProblem = checkUploadFile(file, maxFileBytes);
    if (fileProblem) {
      toast.error(fileProblem);
      return;
    }

    const url = URL.createObjectURL(file);
    urlsRef.current.add(url);

    setRows((previous) =>
      previous.map((row) => {
        if (row.key !== key) return row;
        releaseUrl(row.previewUrl);
        return {
          ...row,
          file,
          fileName: file.name,
          previewUrl: url,
          previewBlob: file,
          storedDox: null,
          rowState: row.original ? "modified" : "added",
        };
      }),
    );
  };

  const clearFile = (key: number) => {
    setRows((previous) =>
      previous.map((row) => {
        if (row.key !== key) return row;
        releaseUrl(row.previewUrl);
        return {
          ...row,
          file: null,
          fileName: "",
          previewUrl: null,
          previewBlob: null,
          note: "",
          storedDox: null,
          rowState: row.original ? "modified" : "added",
        };
      }),
    );
    setPreviewRow((current) => (current?.key === key ? null : current));
    setPreviewContent(null);
  };

  const updateNote = (key: number, note: string) => {
    setRows((previous) =>
      previous.map((row) => {
        if (row.key !== key) return row;
        const rowState = row.original
          ? note === (row.original.fNote ?? "") &&
            !row.file &&
            row.fileName === (row.original.fDoxName ?? "")
            ? "unchanged"
            : "modified"
          : "added";
        return { ...row, note, rowState };
      }),
    );
  };

  const updateFileName = (key: number, fileName: string) => {
    setRows((previous) =>
      previous.map((row) =>
        row.key === key
          ? { ...row, fileName, rowState: row.original ? "modified" : "added" }
          : row,
      ),
    );
  };

  // confirmRemove: the line is taken out of the list (the lines below move up); a saved line is remembered as deleted
  const removeLine = async (key: number) => {
    const row = rows.find((r) => r.key === key);
    if (!row) return;

    // the saved line is deleted from the database at once (when the screen does it); else it is deleted with the ticket save
    if (onRemoveLine) {
      try {
        await onRemoveLine(row.original);
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Unable to delete the line.");
        return;
      }
    } else if (row.original) {
      setDeletedLines((previous) => [...previous, row.original as ServiceChargePolicyAttachment]);
    }

    releaseUrl(row.previewUrl);
    setRows((previous) => {
      const next = previous.filter((r) => r.key !== key);
      while (next.length < MIN_ROWS) next.push(emptyRow());
      return next;
    });
    setPreviewRow((current) => (current?.key === key ? null : current));
    setPreviewContent(null);
  };

  // the lines that were added / changed / removed, as the rows the screen gets
  const changedLines = () =>
    rows.filter(
      (row) =>
        row.rowState !== "unchanged" &&
        (row.original || row.fileName || row.note.trim()),
    );

  const toPayload = async (changed: AttachRow[]): Promise<AttachSavePayload> => {
    let nextSlNo =
      Math.max(0, ...rows.map((row) => row.original?.fSlNo ?? 0)) + 1;
    const deleted = deletedLines.map((line) => ({
      fSlNo: line.fSlNo,
      fNote: null,
      fDoxName: null,
      fDoxType: null,
      fDox: null,
      originalSlNo: line.fSlNo,
      rowState: "deleted" as const,
    }));
    const kept = await Promise.all(
      changed.map(async (row) => ({
        fSlNo: row.original?.fSlNo ?? nextSlNo++,
        fNote: row.note.trim() || null,
        fDoxName: row.fileName || null,
        fDoxType: row.file
          ? fileExtension(row.file.name)
          : row.fileName
            ? row.original?.fDoxType ?? fileExtension(row.fileName)
            : null,
        fDox: row.file ? await fileToBase64(row.file) : row.storedDox,
        ...(row.original ? { originalSlNo: row.original.fSlNo } : {}),
        rowState: row.original ? row.rowState : ("added" as const),
      })),
    );
    return [...deleted, ...kept];
  };

  // the message when the files of the lines are too big together, "" when they are fine
  const totalSizeProblem = (changed: AttachRow[]) =>
    checkUploadTotal(
      changed.reduce((total, row) => total + (row.file?.size ?? base64ByteSize(row.storedDox)), 0),
      maxTotalBytes,
    );

  const handleSave = async () => {
    const changed = changedLines();

    if (changed.length === 0 && deletedLines.length === 0) {
      toast.error("Attach a file or add a note before saving.");
      return;
    }
    const totalProblem = totalSizeProblem(changed);
    if (totalProblem) {
      toast.error(totalProblem);
      return;
    }

    setSaving(true);
    let saved = false;
    try {
      await onSave?.(await toPayload(changed));
      toast.success(saveMessage);
      saved = true;
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Unable to save documents.");
    } finally {
      setSaving(false);
      if (saved) onClose?.();
    }
  };

  // saveOnClose (as the Sales Conjunction popup): closing keeps what was changed
  const handleClose = async () => {
    if (!saveOnClose) {
      onClose?.();
      return;
    }
    const changed = changedLines();
    if (changed.length > 0 || deletedLines.length > 0) {
      const totalProblem = totalSizeProblem(changed);
      if (totalProblem) {
        toast.error(totalProblem);
        return;
      }
      try {
        await onSave?.(await toPayload(changed));
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Unable to keep the documents.");
        return;
      }
    }
    onClose?.();
  };

  // Esc closes it (saveOnClose), unless the confirm window or a preview is open
  useEffect(() => {
    if (!saveOnClose) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "Escape" || confirmingRef.current || previewRow) return;
      void handleClose();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  });

  const handleCancel = () => {
    setDeletedLines([]);
    rows.forEach((row) => releaseUrl(row.previewUrl));
    const fresh = initialRows(attachments);
    setRows(fresh);
    setSelectedKey(fresh[0].key);
    setPreviewRow(null);
    setPreviewContent(null);
  };

  // the x that removes a line (the file and its note): at the end of the File Name, or (confirmRemove) at the end of the Note
  const removeLineButton = (row: AttachRow, index: number) => (
    <button
      type="button"
      title={`Remove line ${index + 1}`}
      aria-label={`Remove file from line ${index + 1}`}
      onClick={async (event) => {
        event.stopPropagation();
        if (confirmRemove) {
          confirmingRef.current = true;
          const yes = await confirm({ message: `Do you want to delete Line ${index + 1}?` });
          setTimeout(() => { confirmingRef.current = false; }, 0);
          if (!yes) return;
          await removeLine(row.key);
          return;
        }
        clearFile(row.key);
      }}
      className="inline-flex h-5 w-5 shrink-0 items-center justify-center rounded text-gray-600 hover:bg-red-50 hover:text-red-600"
    >
      <MdClose size={14} />
    </button>
  );

  return (
    <div className="flex min-h-full w-full items-start justify-center   ">
      <div className="min-h-fit w-262 max-w-full bg-white p-0">
        <main className="w-full overflow-hidden border border-gray-400 bg-white">
          <Header Name={headerName} onClose={saveOnClose ? () => void handleClose() : onClose} />

          <section className="px-3.5 pb-3 pt-3">
            <input
              ref={fileInputRef}
              type="file"
              className="hidden"
              onChange={handleFileChosen}
            />

            <div
              className={`max-h-[min(540px,calc(100vh-240px))] overflow-auto border border-[#B7ECD0] bg-white ${niceScrollbar}`}
            >
              <table className="w-full table-fixed border-collapse text-[13px] text-[#24364d]">
                <colgroup>
                  <col className="w-4.5" />
                  <col className="w-10" />
                  <col className="" />
                  <col className="w-16" />
                  <col className="w-16" />
                  <col className="w-80" />
                </colgroup>
                <thead className="sticky top-0 z-10">
                  <tr>
                    <th className={thClass} />
                    <th className={`${thClass} text-right`}>Line</th>
                    <th id="file" className={`${thClass} text-left`}>File Name</th>
<th className={`${thClass} text-center`}>
  {/* <MdAttachFile size={17} className="mx-auto block" /> */}
</th>                    {/* <th className={`${thClass} text-center`} aria-label="Choose file" > </th> */}
                    <th className={`${thClass} text-center`}>View</th>
                    <th id="txtNote" className={`${thClass} text-left`}>Note</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row, index) => {
                    const selected = row.key === selectedKey;
                    const isNewRow = row.key === firstEmptyKey;
                    return (
                      <tr
                        key={row.key}
                        onClick={() => setSelectedKey(row.key)}
                        className={selected ? "bg-[#f2faf5]" : "bg-white"}
                      >
                        <td className="h-7.5 border border-[#B7ECD0] bg-[#fafbfc] text-center text-[10px] text-[#405066]">
                          {selected ? "▶" : isNewRow ? "*" : ""}
                        </td>

                        <td className="border border-[#B7ECD0] px-2 py-1 text-right">
                          {index + 1}
                        </td>

                        <td className="border border-[#B7ECD0] px-2 py-1">
                          <div className="flex items-center gap-1">
                            {fileNameEditable ? (
                              // the name is filled when a file is chosen (the paperclip) and can also be typed / changed
                              <input
                                aria-label={`File name for line ${index + 1}`}
                                value={row.fileName}
                                maxLength={100}
                                title={row.fileName}
                                onFocus={() => setSelectedKey(row.key)}
                                onChange={(event) => updateFileName(row.key, event.target.value)}
                                className="h-6 min-w-0 flex-1 truncate bg-transparent px-1 text-[13px] outline-none focus:bg-[#E6F6F8]"
                              />
                            ) : (
                              <span
                                className="min-w-0 flex-1 truncate"
                                title={row.fileName}
                              >
                                {row.fileName}
                              </span>
                            )}
                            {!confirmRemove && row.fileName && removeLineButton(row, index)}
                          </div>
                        </td>

                        <td className="border border-[#B7ECD0] text-center">
                          <button
                            type="button"
                            title={`Attach file to line ${index + 1}`}
                            aria-label={`Attach file to line ${index + 1}`}
                            onClick={(event) => {
                              event.stopPropagation();
                              openFilePicker(row);
                            }}
                            className="inline-flex h-6.5 w-7.5 items-center justify-center rounded text-[#287a4b] hover:bg-green-50"
                          >
                            <MdAttachFile size={17} />
                          </button>
                        </td>

                        <td className="border border-[#B7ECD0] text-center">
                          {row.fileName &&
                            (row.previewUrl || (row.original && loadAttachmentFile)) && (
                            <button
                              type="button"
                              title={`Preview ${row.fileName}`}
                              aria-label={`Preview file on line ${index + 1}`}
                              disabled={previewLoading}
                              onClick={(event) => {
                                event.stopPropagation();
                                void openPreview(row);
                              }}
                              className="inline-flex h-6.5 w-7.5 items-center justify-center rounded text-blue-500 hover:bg-blue-50 disabled:opacity-50"
                            >
                              <MdVisibility size={17} />
                            </button>
                          )}
                        </td>

                        <td className="border border-[#B7ECD0] p-0">
                          <div className="flex items-center">
                            <input
                              aria-label={`Note for line ${index + 1}`}
                              value={row.note}
                              maxLength={200}
                              onFocus={() => setSelectedKey(row.key)}
                              onChange={(event) => updateNote(row.key, event.target.value)}
                              className="h-7.5 min-w-0 flex-1 bg-transparent px-2 text-[13px] outline-none focus:bg-[#E6F6F8]"
                            />
                            {confirmRemove && (row.fileName || row.note) && <span className="pr-2">{removeLineButton(row, index)}</span>}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <div className="mt-5 flex justify-center gap-3">
              <button
                id="btnSave"
                type="button"
                disabled={saving}
                onClick={() => void handleSave()}
                className="btn-style disabled:cursor-not-allowed disabled:opacity-60"
              >
                {saving ? "Saving..." : <><u>S</u>ave</>}
              </button>
              <button id="btnCancel" type="button" disabled={saving} onClick={handleCancel} className="btn-style">
                Clear
              </button>
            </div>
          </section>
        </main>
      </div>

      {previewRow?.fileName && (previewLoading || previewRow.previewUrl) && (
        <div
          className="fixed inset-0 z-10000 flex items-center justify-center bg-black/40 p-4"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              setPreviewRow(null);
              setPreviewContent(null);
            }
          }}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="attach-preview-title"
            className="flex max-h-full w-full max-w-200 flex-col overflow-hidden rounded-md border border-[#91a7bb] bg-white shadow-xl"
          >
            <div className="flex h-9.5 shrink-0 items-center justify-between bg-[#9fdfbc] px-3">
              <h2
                id="attach-preview-title"
                className="truncate text-[14px] font-semibold text-[#24364d]"
              >
                Preview - {previewRow.fileName}
              </h2>
              <button
                type="button"
                aria-label="Close preview"
                onClick={() => {
                  setPreviewRow(null);
                  setPreviewContent(null);
                }}
                className="rounded p-1 text-[#24364d] hover:bg-white/40"
              >
                <MdClose size={19} />
              </button>
            </div>

            <div className={`min-h-75 flex-1 overflow-auto bg-[#fafbfc] p-3 ${niceScrollbar}`}>
              {previewLoading ? (
                <div className="flex h-60 items-center justify-center text-sm text-slate-600" role="status">
                  Loading preview...
                </div>
              ) : isImage(previewRow) ? (
                <img
                  src={previewRow.previewUrl ?? undefined}
                  alt={previewRow.fileName}
                  className="mx-auto max-h-[70vh] max-w-full object-contain"
                />
              ) : isPdf(previewRow) ? (
                <iframe
                  title={previewRow.fileName}
                  src={previewRow.previewUrl ?? undefined}
                  className="h-[70vh] w-full border border-[#B7ECD0] bg-white"
                />
              ) : previewContent?.kind === "text" ? (
                <div>
                  {previewContent.truncated && (
                    <p className="mb-2 text-sm text-amber-700">
                      Showing the first 1 MB of this text file.
                    </p>
                  )}
                  <pre className="max-h-[70vh] overflow-auto whitespace-pre-wrap break-words border border-[#B7ECD0] bg-white p-3 text-left text-sm">
                    {previewContent.text}
                  </pre>
                </div>
              ) : previewContent?.kind === "spreadsheet" ? (
                <div>
                  <p className="mb-2 text-sm text-slate-600">
                    First worksheet: {previewContent.sheetName}
                  </p>
                  {previewContent.truncated && (
                    <p className="mb-2 text-sm text-amber-700">
                      Preview limited to the first 1,000 rows and 50 columns.
                    </p>
                  )}
                  <div className={`max-h-[70vh] overflow-auto border border-[#B7ECD0] bg-white ${niceScrollbar}`}>
                    <table className="w-full border-collapse text-left text-sm">
                      <tbody>
                        {previewContent.rows.map((cells, rowIndex) => (
                          <tr key={rowIndex}>
                            {cells.map((cell, cellIndex) => (
                              <td
                                key={cellIndex}
                                className="border border-slate-200 px-2 py-1"
                              >
                                {cell}
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              ) : (
                <div className="flex h-60 flex-col items-center justify-center gap-3 text-[13px] text-[#405066]">
                  <p>
                    {previewContent?.kind === "message"
                      ? previewContent.message
                      : "Preview is not available for this file type."}
                  </p>
                  <a
                    href={previewRow.previewUrl ?? undefined}
                    download={previewRow.fileName}
                    className="btn-style inline-flex items-center"
                  >
                    Download
                  </a>
                </div>
              )}
            </div>

            <div className="flex shrink-0 justify-center border-t border-[#E5E7EB] p-3">
            
            </div>
          </div>
        </div>
      )}
      {dialog}
    </div>
  );
};

export default HotelSalesAttachPage;