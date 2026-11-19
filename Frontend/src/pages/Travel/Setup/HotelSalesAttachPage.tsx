import React, { useEffect, useMemo, useRef, useState } from "react";
import Header from "../../../components/common/Header";
import { MdAttachFile, MdClose, MdVisibility } from "react-icons/md";
import { toast } from "react-toastify";
import type {
  ServiceChargePolicyAttachment,
  ServiceChargePolicyAttachmentSave,
} from "../../../utils/ServiceChargePolicyApi";

type AttachRow = {
  key: number;
  file: File | null;
  fileName: string;
  previewUrl: string | null;
  note: string;
  storedDox: string | null;
  original: ServiceChargePolicyAttachment | null;
  rowState: "added" | "modified" | "unchanged";
};

export type AttachSavePayload = ServiceChargePolicyAttachmentSave[];

type HotelSalesAttachPageProps = {
  onClose?: () => void;
  attachments?: ServiceChargePolicyAttachment[];
  onSave?: (rows: AttachSavePayload) => void | Promise<void>;
};

const MIN_ROWS = 6;
let keyCounter = 0;
const nextKey = () => ++keyCounter;

const emptyRow = (): AttachRow => ({
  key: nextKey(),
  file: null,
  fileName: "",
  previewUrl: null,
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
    previewUrl: attachment.dataUrl,
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
  row.original?.mimeType.startsWith("image/");
const isPdf = (row: AttachRow) =>
  row.file?.type === "application/pdf" ||
  row.original?.mimeType === "application/pdf" ||
  row.fileName.toLowerCase().endsWith(".pdf");

const fileToBase64 = (file: File) =>
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
    reader.onerror = () =>
      reject(reader.error ?? new Error(`Unable to read ${file.name}.`));
    reader.readAsDataURL(file);
  });

const fileExtension = (fileName: string) => {
  const extensionStart = fileName.lastIndexOf(".");
  return extensionStart < 0 ? "" : fileName.slice(extensionStart + 1).toLowerCase();
};

const HotelSalesAttachPage: React.FC<HotelSalesAttachPageProps> = ({
  onClose,
  attachments = [],
  onSave,
}) => {
  const [rows, setRows] = useState<AttachRow[]>(() => initialRows(attachments));
  const [selectedKey, setSelectedKey] = useState<number | null>(rows[0]?.key ?? null);
  const [previewRow, setPreviewRow] = useState<AttachRow | null>(null);
  const [saving, setSaving] = useState(false);

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

  const handleFileChosen = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0] ?? null;
    const key = pickingKeyRef.current;
    event.target.value = "";
    pickingKeyRef.current = null;
    if (!file || key === null) return;

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
          storedDox: null,
          rowState: row.original ? "modified" : "added",
        };
      }),
    );
    setPreviewRow((current) => (current?.key === key ? null : current));
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

  const handleSave = async () => {
    let nextSlNo =
      Math.max(0, ...rows.map((row) => row.original?.fSlNo ?? 0)) + 1;
    const changedRows = rows
      .map((row) => ({ row }))
      .filter(
        ({ row }) =>
          row.rowState !== "unchanged" &&
          (row.original || row.fileName || row.note.trim()),
      );

    if (changedRows.length === 0) {
      toast.error("Attach a file or add a note before saving.");
      return;
    }

    setSaving(true);
    let saved = false;
    try {
      const payload = await Promise.all(
        changedRows.map(async ({ row }) => ({
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
          rowState: row.original ? row.rowState : "added",
        })),
      );
      await onSave?.(payload);
      toast.success("Saved successfully");
      saved = true;
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Unable to save documents.");
    } finally {
      setSaving(false);
      if (saved) onClose?.();
    }
  };

  const handleCancel = () => {
    rows.forEach((row) => releaseUrl(row.previewUrl));
    const fresh = initialRows(attachments);
    setRows(fresh);
    setSelectedKey(fresh[0].key);
    setPreviewRow(null);
  };

  const handleClose = () => onClose?.();

  return (
    <div className="flex min-h-full w-full items-start justify-center   ">
      <div className="min-h-fit w-262 max-w-full bg-white p-0">
        <main className="w-full overflow-hidden border border-gray-400 bg-white">
          <Header Name=" Attach" />

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
                    <th id="file" className={`${thClass} text-left`}>File</th>
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
                            <span
                              className="min-w-0 flex-1 truncate"
                              title={row.fileName}
                            >
                              {row.fileName}
                            </span>
                            {row.fileName && (
                              <button
                                type="button"
                                title={`Remove ${row.fileName}`}
                                aria-label={`Remove file from line ${index + 1}`}
                                onClick={(event) => {
                                  event.stopPropagation();
                                  clearFile(row.key);
                                }}
                                className="inline-flex h-5 w-5 shrink-0 items-center justify-center rounded text-gray-600 hover:bg-red-50 hover:text-red-600"
                              >
                                <MdClose size={14} />
                              </button>
                            )}
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
                          {row.fileName && row.previewUrl && (
                            <button
                              type="button"
                              title={`Preview ${row.fileName}`}
                              aria-label={`Preview file on line ${index + 1}`}
                              onClick={(event) => {
                                event.stopPropagation();
                                setSelectedKey(row.key);
                                setPreviewRow(row);
                              }}
                              className="inline-flex h-6.5 w-7.5 items-center justify-center rounded text-blue-500 hover:bg-blue-50"
                            >
                              <MdVisibility size={17} />
                            </button>
                          )}
                        </td>

                        <td className="border border-[#B7ECD0] p-0">
                          <input
                            aria-label={`Note for line ${index + 1}`}
                            value={row.note}
                            maxLength={200}
                            onFocus={() => setSelectedKey(row.key)}
                            onChange={(event) => updateNote(row.key, event.target.value)}
                            className="h-7.5 w-full bg-transparent px-2 text-[13px] outline-none focus:bg-[#E6F6F8]"
                          />
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
              {onClose && (
                <button
                  id="btnClose"
                  type="button"
                  disabled={saving}
                  onClick={handleClose}
                  className="btn-style disabled:cursor-not-allowed disabled:opacity-60"
                >
                  Close
                </button>
              )}
            </div>
          </section>
        </main>
      </div>

      {previewRow?.fileName && previewRow.previewUrl && (
        <div
          className="fixed inset-0 z-10000 flex items-center justify-center bg-black/40 p-4"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) setPreviewRow(null);
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
                onClick={() => setPreviewRow(null)}
                className="rounded p-1 text-[#24364d] hover:bg-white/40"
              >
                <MdClose size={19} />
              </button>
            </div>

            <div className={`min-h-75 flex-1 overflow-auto bg-[#fafbfc] p-3 ${niceScrollbar}`}>
              {isImage(previewRow) ? (
                <img
                  src={previewRow.previewUrl}
                  alt={previewRow.fileName}
                  className="mx-auto max-h-[70vh] max-w-full object-contain"
                />
              ) : isPdf(previewRow) ? (
                <iframe
                  title={previewRow.fileName}
                  src={previewRow.previewUrl}
                  className="h-[70vh] w-full border border-[#B7ECD0] bg-white"
                />
              ) : (
                <div className="flex h-60 flex-col items-center justify-center gap-3 text-[13px] text-[#405066]">
                  <p>Preview is not available for this file type.</p>
                  <a
                    href={previewRow.previewUrl}
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
    </div>
  );
};

export default HotelSalesAttachPage;