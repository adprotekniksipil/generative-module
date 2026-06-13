declare module "jspdf-autotable" {
  import jsPDF from "jspdf";

  interface UserOptions {
    head?: (string | number)[][];
    body?: (string | number)[][];
    startY?: number;
    styles?: Record<string, unknown>;
    columnStyles?: Record<number, Record<string, unknown>>;
    headStyles?: Record<string, unknown>;
    alternateRowStyles?: Record<string, unknown>;
    didParseCell?: (data: {
      row: { index: number };
      column: { index: number };
      section: string;
      cell: { raw: unknown; styles: Record<string, unknown> };
    }) => void;
  }

  function autoTable(doc: jsPDF, options: UserOptions): void;
  export default autoTable;
}
