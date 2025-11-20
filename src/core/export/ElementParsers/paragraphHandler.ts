import {
  computedStyleToNumber,
  CSS_FONT_TO_WORD_FONT,
  pxToPt,
  pxToTwips,
} from "../utils";
import {
  IParagraphOptions,
  IRunOptions,
  ISpacingProperties,
  TextRun,
} from "docx";
interface MeasurementNode {
  wrapperDiv: HTMLDivElement;
  measurementSpan: HTMLSpanElement;
}
interface StyledPiece {
  text: string;
  bold: boolean;
  italic: boolean;
  underline: boolean;
  strike: boolean;
}
interface Range {
  start: number; // inclusive
  end: number; // inclusive
  text: string; // the actual substring
}
export interface SegmentInfo {
  props: IParagraphOptions;
  isFirstSegment: boolean;
}

interface FormattingRanges {
  text: string; // the full text with all tags stripped out
  boldRanges: Range[];
  italicRanges: Range[];
  underlineRanges: Range[];
  strikeRanges: Range[];
}
type TextStyle = {
  bold: boolean;
  italic: boolean;
  underline: boolean;
  strike: boolean;
};

interface StyledRun extends TextStyle {
  text: string;
}

export class ParagraphHandler {
  constructor() {}

  /**
   * Create hidden DOM nodes to measure text wrapping.
   * @returns the container and span used for measurement
   */
  public createMeasurementContainer(
    spanComputeStyle?: CSSStyleDeclaration
  ): MeasurementNode {
    const wrapperDiv = document.createElement("div");
    // mirror your real editor CSS
    wrapperDiv.style.background = "rgb(248 249 250 / 18%";
    wrapperDiv.style.height = "100%";
    wrapperDiv.style.width = "100%";
    wrapperDiv.style.display = "flex";
    wrapperDiv.style.flexDirection = "column";
    wrapperDiv.style.overflow = "hidden";
    wrapperDiv.style.position = "absolute"; // take it out of the flow
    wrapperDiv.style.top = "0"; // pin it to the top of the viewport
    wrapperDiv.style.left = "0"; // pin it to the left
    wrapperDiv.style.zIndex = "1"; // sit on top of everything

    const realPageWrapper = document.querySelector(
      ".editor-wrapper"
    ) as HTMLDivElement;
    // 2. Clone just the element (no children)
    const pageWrapper = realPageWrapper.cloneNode(false) as HTMLDivElement;

    // 3. Copy the few computed props you care about
    const cs = window.getComputedStyle(realPageWrapper);

    pageWrapper.style.backgroundColor = cs.backgroundColor; // rgb(248,249,250)
    pageWrapper.style.display = cs.display; // flex
    pageWrapper.style.flexDirection = cs.flexDirection; // column
    pageWrapper.style.width = cs.width; // 1159.09px
    pageWrapper.style.height = cs.height; // 849.09px
    pageWrapper.style.overflowX = cs.overflowX; // hidden
    pageWrapper.style.overflowY = cs.overflowY; // hidden
    pageWrapper.style.unicodeBidi = cs.unicodeBidi; // isolate

    const editorContainer = document.createElement("div");
    editorContainer.style.position = "relative";
    editorContainer.style.flex = "1";
    editorContainer.style.overflowY = "auto";
    editorContainer.style.overflowX = "hidden";

    const editorWrapper = document
      .querySelector(".editor-wrapper")!
      .cloneNode(false) as HTMLDivElement;
    const editor = document
      .querySelector(".editor")!
      .cloneNode(false) as HTMLDivElement;

    const measurementSpan = document.createElement("p");
    if (spanComputeStyle) {
      const { width, paddingLeft, fontSize } = spanComputeStyle;
      measurementSpan.style.maxWidth = width;
      measurementSpan.style.padding = `0 ${paddingLeft}`;
      measurementSpan.style.fontSize = fontSize;
    }
    measurementSpan.style.position = "relative";
    measurementSpan.style.top = "260px";
    measurementSpan.style.background = "#f00a";
    measurementSpan.style.background = "#f00a";
    measurementSpan.style.whiteSpace = "break-spaces !important";

    // build the tree
    wrapperDiv.appendChild(pageWrapper);
    pageWrapper.appendChild(editorContainer);
    editorContainer.appendChild(editorWrapper);
    editorWrapper.appendChild(editor);
    editor.appendChild(measurementSpan);

    return { wrapperDiv, measurementSpan };
  }
  /**
   * Split an HTMLElement on <br> (even when nested inside tags),
   * preserve all inline formatting, measure & segment each line,
   * and return one props‐object per segment.
   */
  public segmentParagraph(element: HTMLElement): SegmentInfo[] {
    this.removeTrailingBreaks(element);
    const computedStyle = window.getComputedStyle(element);
    const segments: SegmentInfo[] = [];

    const linesOfNodes = this.splitToLines(Array.from(element.childNodes));

    linesOfNodes.forEach((lineNodes, lineIndex) => {
      const wrapper = document.createElement("div");
      lineNodes.forEach((node) => wrapper.appendChild(node.cloneNode(true)));
      const htmlFragment = wrapper.innerHTML;

      const formatting = this.extractFormattingRanges(htmlFragment);
      const plainText = formatting.text;

      const measuredText = this.measureParagraphLine(plainText, computedStyle);
      const textSegments = this.splitContentIntoSegments(measuredText);

      let cumulativeOffset = 0;
      textSegments.forEach((segmentText, segmentIndex) => {
        const paragraphOptions = this.createDocxParagraph(
          segmentText,
          lineIndex,
          segmentIndex,
          textSegments.length,
          linesOfNodes.length,
          computedStyle,
          this.getSpacingAfterPx(element, computedStyle),
          cumulativeOffset,
          formatting
        );
        segments.push({
          props: paragraphOptions,
          isFirstSegment: segmentIndex === 0,
        });
        cumulativeOffset += segmentText.length;
      });
    });

    return segments;
  }
  /**
   * Remove any ProseMirror “trailing break” `<br>` elements that occur
   * at the end of their parent within the specified container.
   *
   * This is useful to clean up empty line artifacts inserted by ProseMirror
   * (e.g. `<br class="ProseMirror-trailingBreak">`) so they don’t end up
   * in the exported HTML or measurement logic.
   *
   * @private
   * @param element - The root HTMLElement in which to remove trailing breaks.
   *                    Any `<br>` with class "ProseMirror-trailingBreak" that
   *                    is the last child of its parent will be removed.
   */
  private removeTrailingBreaks(element: HTMLElement): void {
    const trailingBreaks = element.querySelectorAll(
      "br.ProseMirror-trailingBreak"
    );
    trailingBreaks.forEach((br) => {
      // Remove only if it's the last child (trailing)
      if (br.parentElement?.lastChild === br) {
        br.remove();
      }
    });
  }
  /**
   * Recursively walk a Node[] and split on <br> into an array of lines (Node[][]),
   * preserving nested element wrappers around exactly the right nodes.
   */
  private splitToLines(nodes: Node[]): Node[][] {
    const lines: Node[][] = [[]];

    nodes.forEach((node) => {
      if (
        node.nodeType === Node.ELEMENT_NODE &&
        (node as HTMLElement).tagName === "BR"
      ) {
        // Hard break
        lines.push([]);
      } else if (node.nodeType === Node.TEXT_NODE) {
        // Plain text clones into the current line
        lines[lines.length - 1].push(node.cloneNode(true));
      } else if (node.nodeType === Node.ELEMENT_NODE) {
        // Recurse into element children
        const elementNode = node as HTMLElement;
        const childLines = this.splitToLines(
          Array.from(elementNode.childNodes)
        );

        childLines.forEach((childLineNodes, idx) => {
          // Clone just the wrapper tag
          const wrapperClone = elementNode.cloneNode(false) as HTMLElement;
          childLineNodes.forEach((childNode) =>
            wrapperClone.appendChild(childNode)
          );

          if (idx === 0) {
            // First child-line merges into current output line
            lines[lines.length - 1].push(wrapperClone);
          } else {
            // Subsequent lines start new output lines
            lines.push([wrapperClone]);
          }
        });
      }
    });

    return lines;
  }
  /**
   * Find the very next block‐level element (or its first <p>) in document order.
   */
  private findNextBlock(start: Node | null): HTMLElement | null {
    let cursor: Node | null = start;

    while (cursor) {
      // 1) if there’s a next sibling, descend into it
      if (cursor.nextSibling) {
        cursor = cursor.nextSibling;
        // if it’s an element, see if it (or its first <p>) counts
        if (cursor instanceof HTMLElement) {
          const maybeP = cursor.querySelector<HTMLElement>("p");
          return maybeP ?? cursor;
        }
        // otherwise, keep scanning within this subtree
        continue;
      }

      // 2) no next sibling → climb up to the parent
      cursor = cursor.parentElement;
    }

    return null;
  }

  public getSpacingAfterPx(
    element: HTMLElement,
    style: CSSStyleDeclaration
  ): number {
    const marginBottom = computedStyleToNumber(style.marginBottom);

    // Try to find a "same-list" next <p> first (covers multiple <p> per <li>)
    const directNext = element.nextElementSibling as HTMLElement | null;
    if (directNext?.tagName === "P") {
      const mt = computedStyleToNumber(
        window.getComputedStyle(directNext).marginTop
      );
      return marginBottom + mt;
    }

    // Otherwise fall back to document‐order walk
    const nextBlock = this.findNextBlock(element);
    const siblingMarginTop = nextBlock
      ? computedStyleToNumber(window.getComputedStyle(nextBlock).marginTop)
      : 0;
    return marginBottom + siblingMarginTop;
  }

  /**
   * Measure where a line of text wraps by inserting newline markers.
   * @param lineText the text of the paragraph line
   * @returns the text with '\n' at wrap points
   */
  public measureParagraphLine(
    lineText: string,
    paragraphComputeStle?: CSSStyleDeclaration
  ): string {
    const { wrapperDiv, measurementSpan } =
      this.createMeasurementContainer(paragraphComputeStle);
    document.body.appendChild(wrapperDiv);

    if (!lineText) {
      document.body.removeChild(wrapperDiv);
      return "";
    }
    const breakIndices: number[] = [];
    let lineStart = 0;
    let currentText = "";

    for (let i = 0; i < lineText.length; i++) {
      const startHeight = measurementSpan.offsetHeight;
      currentText += lineText[i];
      measurementSpan.textContent = currentText;
      const endHeight = measurementSpan.offsetHeight;
      // when the hidden span grows in height, we know we wrapped
      if (startHeight !== 0 && startHeight < endHeight) {
        // This ensures we break at the most recent valid delimiter, improving wrapping
        // for compound words and questions.
        const BREAK_CHARS = [" ", "-", "?"];
        let lastBreak = -1;

        // Find the rightmost (last) break character
        for (const char of BREAK_CHARS) {
          const pos = currentText.lastIndexOf(char);
          if (pos > lastBreak) {
            lastBreak = pos;
          }
        }

        // if that break character is a space right at the end, look for the one before it
        if (
          lastBreak === currentText.length - 1 &&
          currentText[lastBreak] === " "
        ) {
          // Find the last break character before this position
          let prevBreak = -1;
          for (const char of BREAK_CHARS) {
            const pos = currentText.lastIndexOf(char, lastBreak - 1);
            if (pos > prevBreak) {
              prevBreak = pos;
            }
          }
          lastBreak = prevBreak;
        }
        if (lastBreak > 0) {
          breakIndices.push(lineStart + lastBreak);
          i = lineStart + lastBreak;
          lineStart = i + 1;
          currentText = "";
        } else {
          const breakAt = i > lineStart ? i - 1 : i;
          breakIndices.push(breakAt);
          i = breakAt;
          lineStart = breakAt + 1;
          currentText = "";
        }
      }
    }
    //for debug remove the row below
    document.body.removeChild(wrapperDiv);

    // rebuild with newline characters
    let result = "";
    let prev = 0;
    for (const br of breakIndices) {
      const ch = lineText[br];

      if (ch === " ") {
        // replace the space with a newline
        result += lineText.slice(prev, br) + "\n";
        prev = br + 1; // skip the space
      } else {
        // no space here → insert newline before this character
        result += lineText.slice(prev, br + 1) + "\n";
        prev = br + 1; // we've already consumed br
      }
    }
    result += lineText.slice(prev);
    return result;
  }
  /**
   * Split measured content into non-empty segments.
   * @param measuredContent the string containing '\n' markers
   * @returns array of trimmed segments
   */
  public splitContentIntoSegments(measuredContent: string): string[] {
    const segments = measuredContent
      .split(/(?:\r?\n|<br\s*\/?>)/)
      .map((seg) => seg.replace(/\s+$/, ""))
      .filter((seg) => seg.length > 0);
    return segments.length ? segments : [measuredContent];
  }

  /**
   * Create docx-compatible children and spacing for a text segment.
   * @param segmentText the text segment
   * @param lineIndex index of the line in original paragraph
   * @param segmentIndex index of this segment in the line
   * @param totalSegments total number of segments for this line
   * @param totalLines total number of lines in the paragraph
   * @param style the computed CSS style
   * @param spacingAfterPx spacing after the paragraph in px
   * @param startIndex absolute start index of this segment in full text
   * @param formatting formatting ranges for bold/italic/etc
   */
  public createDocxParagraph(
    segment: string,
    paragraphLineIndex: number,
    segmentIndex: number,
    segmentsCount: number,
    totalLinesCount: number,
    computedStyle: CSSStyleDeclaration,
    afterSpacingPX: number,
    startSegmentIndex: number,
    formatting: FormattingRanges
  ): {
    children: TextRun[];
    spacing: ISpacingProperties;
  } {
    const styledPieces = this.splitSegmentByFormatting(
      segment,
      startSegmentIndex,
      formatting
    );
    const children = styledPieces.map(
      (para) =>
        new TextRun({
          ...this.getBaseTextRunProps(computedStyle),
          text: para.text,
          bold: para.bold,
          italics: para.italic,
          strike: para.strike,
          underline: para.underline
            ? {
                type: "single",
              }
            : undefined,
        })
    );
    const spacing = this.computeSpacing(
      paragraphLineIndex,
      segmentIndex,
      segmentsCount,
      totalLinesCount,
      computedStyle,
      afterSpacingPX
    );
    return { children, spacing };
  }

  /**
   * Parse HTML inline tags (<b>, <i>, <u>, <s>) into text and ranges.
   * @param htmlFragment innerHTML containing formatting tags
   */
  public extractFormattingRanges(html: string): FormattingRanges {
    const container = document.createElement("div");
    container.innerHTML = html;
    const runs: StyledRun[] = [];
    function traverse(node: Node, style: TextStyle) {
      if (node.nodeType === Node.TEXT_NODE) {
        const txt = node.textContent || "";
        if (txt) runs.push({ text: txt, ...style });
      } else if (node instanceof HTMLElement) {
        // detect style tags
        const tag = node.tagName;
        const next: TextStyle = { ...style };
        if (tag === "STRONG" || tag === "B") next.bold = true;
        if (tag === "EM" || tag === "I") next.italic = true;
        if (tag === "U") next.underline = true;
        if (tag === "S" || tag === "STRIKE" || tag === "DEL")
          next.strike = true;

        node.childNodes.forEach((child) => traverse(child, next));
      }
    }
    traverse(container, {
      bold: false,
      italic: false,
      underline: false,
      strike: false,
    });

    const fullText = runs.map((r) => r.text).join("");

    function collectRanges<K extends keyof TextStyle>(flag: K): Range[] {
      const out: Range[] = [];
      let cursor = 0;
      let open: Range | null = null;

      for (const run of runs) {
        const len = run.text.length;
        if (run[flag]) {
          if (!open) {
            // start new range
            open = { start: cursor, end: cursor + len - 1, text: run.text };
          } else {
            // extend existing
            open.end += len;
            open.text += run.text;
          }
        } else if (open) {
          // close it
          out.push(open);
          open = null;
        }
        cursor += len;
      }
      if (open) out.push(open);
      return out;
    }

    return {
      text: fullText,
      boldRanges: collectRanges("bold"),
      italicRanges: collectRanges("italic"),
      underlineRanges: collectRanges("underline"),
      strikeRanges: collectRanges("strike"),
    };
  }
  /**
   * Compute paragraph spacing based on line/segment position.
   */
  public computeSpacing(
    paragraphLineIndex: number,
    segmentIndex: number,
    segmentsCount: number,
    totalLinesCount: number,
    computedStyle: CSSStyleDeclaration,
    afterSpacingPX: number
  ) {
    const lineH = computedStyleToNumber(computedStyle.lineHeight);
    return paragraphLineIndex === totalLinesCount - 1 &&
      segmentIndex === segmentsCount - 1
      ? this.getFinalSpacing(afterSpacingPX, lineH)
      : this.baseLineSpaceing(lineH);
  }
  /**
   * Get base run options (size and font) from computed style.
   * @param computedStyle the computed CSS style of the node
   * @returns IRunOptions partial for a TextRun
   */
  public getBaseTextRunProps(
    computedStyle: CSSStyleDeclaration
  ): Partial<IRunOptions> {
    return {
      size: pxToPt(computedStyleToNumber(computedStyle.fontSize)) * 2,
      font: CSS_FONT_TO_WORD_FONT[
        computedStyle.fontFamily as keyof typeof CSS_FONT_TO_WORD_FONT
      ],
    };
  }
  /**
   * Break a text segment into styled pieces based on formatting ranges.
   */
  private splitSegmentByFormatting(
    segment: string,
    segmentStart: number,
    formatting: FormattingRanges
  ): StyledPiece[] {
    const pieces: StyledPiece[] = [];
    // 1) collect all break‐points: segment bounds + any formatting boundaries inside it
    const boundaries = new Set<number>([0, segment.length]);

    // helper to add a formatting range’s boundaries if it overlaps this segment
    function addBoundaries(rngs: Range[]) {
      for (const rng of rngs) {
        // if the range lies completely before or after our segment, skip it
        if (
          rng.end < segmentStart ||
          rng.start > segmentStart + segment.length - 1
        ) {
          continue;
        }
        // map absolute range to segment‐relative indices
        const relStart = Math.max(0, rng.start - segmentStart);
        const relEnd = Math.min(segment.length, rng.end + 1 - segmentStart);
        boundaries.add(relStart);
        boundaries.add(relEnd);
      }
    }

    addBoundaries(formatting.boldRanges);
    addBoundaries(formatting.italicRanges);
    addBoundaries(formatting.underlineRanges);
    addBoundaries(formatting.strikeRanges);

    // 2) sort all boundary offsets
    const sorted = Array.from(boundaries).sort((a, b) => a - b);

    // 3) slice the segment at each pair of boundaries
    for (let i = 0; i + 1 < sorted.length; i++) {
      const subStart = sorted[i];
      const subEnd = sorted[i + 1]; // exclusive
      if (subStart === subEnd) continue; // no text here

      const text = segment.slice(subStart, subEnd);
      const absStart = segmentStart + subStart;
      const absEnd = absStart + text.length - 1;

      // 4) check which styles apply to this entire slice
      const bold = formatting.boldRanges.some(
        (r) => r.start <= absStart && r.end >= absEnd
      );
      const italic = formatting.italicRanges.some(
        (r) => r.start <= absStart && r.end >= absEnd
      );
      const underline = formatting.underlineRanges.some(
        (r) => r.start <= absStart && r.end >= absEnd
      );
      const strike = formatting.strikeRanges.some(
        (r) => r.start <= absStart && r.end >= absEnd
      );

      pieces.push({ text, bold, italic, underline, strike });
    }

    return pieces;
  }
  // Base spacing and derive final and intermediate spacing.
  private getFinalSpacing(afterSpacingPX: number, lineHeight: number) {
    return {
      ...this.baseLineSpaceing(lineHeight),
      after: pxToTwips(afterSpacingPX),
    };
  }
  private baseLineSpaceing(lineHeightPx: number): ISpacingProperties {
    return {
      line: pxToTwips(lineHeightPx),
      lineRule: "atLeast",
    };
  }
}
