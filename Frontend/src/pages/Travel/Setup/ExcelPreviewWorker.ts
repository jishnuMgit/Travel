import ExcelJS from "exceljs";

type ExcelPreviewResult =
  | {
      success: true;
      sheetName: string;
      rows: string[][];
      truncated: boolean;
    }
  | { success: false; message: string };

declare const self: {
  onmessage: ((event: MessageEvent<ArrayBuffer>) => void) | null;
  postMessage: (message: ExcelPreviewResult) => void;
};

const MAX_ROWS = 1000;
const MAX_COLUMNS = 50;

self.onmessage = async ({ data }) => {
  try {
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(data);
    const worksheet = workbook.worksheets[0];
    if (!worksheet) {
      self.postMessage({
        success: false,
        message: "This workbook does not contain a worksheet to preview.",
      });
      return;
    }

    const rows: string[][] = [];
    let truncated = worksheet.rowCount > MAX_ROWS;
    const lastRow = Math.min(worksheet.rowCount, MAX_ROWS);
    for (let rowNumber = 1; rowNumber <= lastRow; rowNumber += 1) {
      const worksheetRow = worksheet.getRow(rowNumber);
      if (!worksheetRow.hasValues) continue;

      if (worksheetRow.cellCount > MAX_COLUMNS) truncated = true;
      const columnCount = Math.min(worksheetRow.cellCount, MAX_COLUMNS);
      rows.push(
        Array.from(
          { length: columnCount },
          (_, index) => worksheetRow.getCell(index + 1).text,
        ),
      );
    }

    self.postMessage({
      success: true,
      sheetName: worksheet.name,
      rows,
      truncated,
    });
  } catch (error) {
    self.postMessage({
      success: false,
      message:
        error instanceof Error
          ? error.message
          : "Unable to read the workbook.",
    });
  }
};

export {};
