// Draws an ExportTable onto a canvas and returns a PNG, so a result table can
// be pasted into Zalo as a picture without any extra dependency.

import type { ExportTable } from "@/tools/mic-filter/export";

const SCALE = 2;
const PADDING = 24;
const CELL_PADDING_X = 14;
const CELL_PADDING_Y = 10;
const LINE_HEIGHT = 22;
const FIRST_COLUMN_WIDTH = 72;
const OTHER_COLUMN_WIDTH = 220;
const FONT = '15px "Segoe UI", Roboto, Arial, sans-serif';
const BOLD_FONT = '600 15px "Segoe UI", Roboto, Arial, sans-serif';
const TITLE_FONT = '700 20px "Segoe UI", Roboto, Arial, sans-serif';

const COLORS = {
  background: "#ffffff",
  title: "#0f172a",
  headerBackground: "#e0f2fe",
  headerText: "#0c4a6e",
  border: "#cbd5e1",
  text: "#1e293b",
  muted: "#64748b",
  zebra: "#f8fafc",
};

export async function renderTableImage(table: ExportTable): Promise<Blob> {
  const columnWidths = table.headers.map((_, index) =>
    index === 0 ? FIRST_COLUMN_WIDTH : OTHER_COLUMN_WIDTH,
  );
  const tableWidth = columnWidths.reduce((total, width) => total + width, 0);
  const width = tableWidth + PADDING * 2;

  const measureCanvas = document.createElement("canvas");
  const measure = measureCanvas.getContext("2d");

  if (!measure) {
    throw new Error("Trình duyệt không hỗ trợ vẽ ảnh.");
  }

  measure.font = FONT;

  const bodyRows =
    table.rows.length > 0 ? table.rows : [[table.emptyMessage]];
  const wrappedRows = bodyRows.map((row) =>
    row.map((cell, index) =>
      wrapText(
        measure,
        cell,
        (row.length === 1 ? tableWidth : columnWidths[index]) -
          CELL_PADDING_X * 2,
      ),
    ),
  );
  const rowHeights = wrappedRows.map(
    (row) =>
      Math.max(...row.map((lines) => lines.length)) * LINE_HEIGHT +
      CELL_PADDING_Y * 2,
  );
  const headerHeight = LINE_HEIGHT + CELL_PADDING_Y * 2;
  const titleHeight = 40;
  const height =
    PADDING * 2 +
    titleHeight +
    headerHeight +
    rowHeights.reduce((total, rowHeight) => total + rowHeight, 0);

  const canvas = document.createElement("canvas");
  canvas.width = width * SCALE;
  canvas.height = height * SCALE;

  const context = canvas.getContext("2d");

  if (!context) {
    throw new Error("Trình duyệt không hỗ trợ vẽ ảnh.");
  }

  context.scale(SCALE, SCALE);
  context.fillStyle = COLORS.background;
  context.fillRect(0, 0, width, height);
  context.textBaseline = "top";

  context.font = TITLE_FONT;
  context.fillStyle = COLORS.title;
  context.fillText(table.title, PADDING, PADDING);

  let y = PADDING + titleHeight;

  context.fillStyle = COLORS.headerBackground;
  context.fillRect(PADDING, y, tableWidth, headerHeight);
  context.font = BOLD_FONT;
  context.fillStyle = COLORS.headerText;

  let x = PADDING;

  table.headers.forEach((header, index) => {
    context.fillText(header, x + CELL_PADDING_X, y + CELL_PADDING_Y + 3);
    x += columnWidths[index];
  });

  y += headerHeight;

  wrappedRows.forEach((row, rowIndex) => {
    const rowHeight = rowHeights[rowIndex];

    if (rowIndex % 2 === 1) {
      context.fillStyle = COLORS.zebra;
      context.fillRect(PADDING, y, tableWidth, rowHeight);
    }

    x = PADDING;

    row.forEach((lines, cellIndex) => {
      const isEmptyMessage = table.rows.length === 0;
      const isFloor = cellIndex === 0 && !isEmptyMessage;

      context.font = isFloor ? BOLD_FONT : FONT;
      context.fillStyle =
        isEmptyMessage || lines.join("") === "-" ? COLORS.muted : COLORS.text;

      lines.forEach((line, lineIndex) => {
        context.fillText(
          line,
          x + CELL_PADDING_X,
          y + CELL_PADDING_Y + 3 + lineIndex * LINE_HEIGHT,
        );
      });

      x += columnWidths[cellIndex];
    });

    context.strokeStyle = COLORS.border;
    context.lineWidth = 1;
    context.beginPath();
    context.moveTo(PADDING, y + 0.5);
    context.lineTo(PADDING + tableWidth, y + 0.5);
    context.stroke();

    y += rowHeight;
  });

  context.strokeStyle = COLORS.border;
  context.strokeRect(
    PADDING + 0.5,
    PADDING + titleHeight + 0.5,
    tableWidth - 1,
    y - PADDING - titleHeight - 1,
  );

  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) {
        resolve(blob);
      } else {
        reject(new Error("Không tạo được ảnh."));
      }
    }, "image/png");
  });
}

// Copies the PNG to the clipboard; if the browser refuses, downloads it.
export async function copyOrDownloadImage(blob: Blob, fileName: string) {
  if (
    typeof ClipboardItem !== "undefined" &&
    navigator.clipboard &&
    "write" in navigator.clipboard
  ) {
    try {
      await navigator.clipboard.write([new ClipboardItem({ "image/png": blob })]);
      return "copied" as const;
    } catch {
      // Fall through to download
    }
  }

  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = fileName;
  link.click();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);

  return "downloaded" as const;
}

function wrapText(
  context: CanvasRenderingContext2D,
  text: string,
  maxWidth: number,
) {
  const words = text.split(" ");
  const lines: string[] = [];
  let current = "";

  for (const word of words) {
    const candidate = current ? `${current} ${word}` : word;

    if (context.measureText(candidate).width <= maxWidth || !current) {
      current = candidate;
    } else {
      lines.push(current);
      current = word;
    }
  }

  if (current) {
    lines.push(current);
  }

  return lines.length > 0 ? lines : [""];
}
