import { ElementParser } from "./ElementParser";
import { FileChild } from "docx";
import * as docx from "docx";
import { ParagraphHandler } from "./ParagraphHandler";
import { pxToPt } from "../utils";
import { nextListInstance } from "./util/listCounter";
import { Exporter } from "../Exporter";
interface CellData {
  paras: docx.Paragraph[] | FileChild[]; // the paragraphs in that cell
  columnSpan?: number; // colspan > 1
  rowSpan?: number; // rowspan > 1
}
export class TableParser extends ElementParser {
  constructor(exporter: Exporter) {
    super(exporter, 10);
  }

  /**
   * Determine if this parser should handle the given element.
   * @param element the DOM element to test
   * @returns true if element is an ordered list (<ol>)
   */
  static matches(element: HTMLElement): boolean {
    return element.tagName === "DIV";
  }

  public parse(element: HTMLElement): FileChild[] | FileChild | null {
    const output: FileChild[] = [];
    type BufferEntry = CellData[] | "spacer";

    let buffer: BufferEntry[] = [];

    // helper to flush buffered rows into a Table
    const flushTable = () => {
      if (!buffer.length) return;
      const tableRows: docx.TableRow[] = [];
      let nextBreak = false;

      for (const entry of buffer) {
        if (entry === "spacer") {
          nextBreak = true;
          continue;
        }

        // entry is CellData[]
        const cells = entry.map((cellData, cellIndex) => {
          // inject page-break into first cell if needed
          if (nextBreak && cellIndex === 0) {
            return new docx.TableCell({
              children: [
                new docx.Paragraph({ text: "", pageBreakBefore: true }),
                ...cellData.paras,
              ],
              columnSpan: cellData.columnSpan,
              rowSpan: cellData.rowSpan,
              ...this.cellProp(),
            });
          }
          return new docx.TableCell({
            children: cellData.paras,
            columnSpan: cellData.columnSpan,
            rowSpan: cellData.rowSpan,
            ...this.cellProp(),
          });
        });

        tableRows.push(
          new docx.TableRow({ children: cells, ...this.rowProp() })
        );
        nextBreak = false;
      }

      output.push(
        new docx.Table({
          rows: tableRows,
          ...this.tableProp(element),
        })
      );
      // optional spacer paragraph between tables
      output.push(
        new docx.Paragraph({
          children: [new docx.TextRun(" ")],
          spacing: { after: 100 },
        })
      );

      buffer = [];
    };

    // grab all direct children of <tbody>
    const allKids = Array.from(element.querySelectorAll("tbody")).flatMap(
      (tb) =>
        Array.from(tb.children).filter(
          (tbChild): tbChild is HTMLElement => tbChild instanceof HTMLElement
        )
    );

    for (const kid of allKids) {
      if (kid.classList.contains("spacer")) {
        buffer.push("spacer");
      } else if (kid.tagName === "TR") {
        buffer.push(this.parseTableRow(kid));
      }
    }

    // flush any trailing rows
    flushTable();
    return output.length ? output : null;
  }
  /**
   * Parse a single <tr> into an array of Paragraph[]
   */
  private parseTableRow(rowEl: HTMLElement): CellData[] {
    return Array.from(rowEl.children)
      .filter((el): el is HTMLElement => el instanceof HTMLElement)
      .map((cellEl) => {
        // 1) extract span attributes
        const colspan = parseInt(cellEl.getAttribute("colspan") ?? "1", 10);
        const rowspan = parseInt(cellEl.getAttribute("rowspan") ?? "1", 10);

        const paras: FileChild[] = [];

        for (const child of Array.from(cellEl.children) as HTMLElement[]) {
          if (child.tagName === "P") {
            paras.push(...this.handleParagraph(child));
          } else {
            const parsed = this.exporter.parse(child, nextListInstance());
            if (!parsed) continue;
            const arr = Array.isArray(parsed) ? parsed : [parsed];
            paras.push(...arr);
          }
        }

        // only if we never saw a paragraph or list, fall back:
        if (paras.length === 0) {
          paras.push(...this.handleParagraph(cellEl));
        }
        // 3) return the enriched CellData
        return {
          paras,
          ...(colspan > 1 ? { columnSpan: colspan } : {}),
          ...(rowspan > 1 ? { rowSpan: rowspan } : {}),
        };
      });
  }
  /**
   * Parse a single <p> into an array of Paragraph
   */
  private handleParagraph(cellEl: HTMLElement): docx.Paragraph[] {
    const paragraphHandler = new ParagraphHandler();
    return paragraphHandler
      .segmentParagraph(cellEl)
      .map(({ props }) => new docx.Paragraph({ ...props }));
  }

  private cellProp(): Partial<docx.ITableCellOptions> {
    return {
      verticalAlign: "center",
      margins: {
        marginUnitType: "dxa",
        right: 160,
        left: 160,
        top: 120,
        bottom: 120,
      },
    };
  }
  private rowProp(): Partial<docx.ITableRowOptions> {
    return { height: { value: `${pxToPt(53)}pt`, rule: "atLeast" } };
  }
  private tableProp(element: HTMLElement): Partial<docx.ITableOptions> {
    const tablestyle = window.getComputedStyle(element);
    const pxWidth = parseFloat(tablestyle.width);
    const ptWidth = pxToPt(pxWidth);

    return { width: { size: `${ptWidth}pt` } };
  }
}
