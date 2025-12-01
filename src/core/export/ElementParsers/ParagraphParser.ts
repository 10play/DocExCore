import { ElementParser } from "./ElementParser";
import { FileChild, Paragraph } from "docx";
import { ParagraphHandler, SegmentInfo } from "./ParagraphHandler";
import { Exporter } from "../Exporter";

export class ParagraphParser extends ElementParser {
  constructor(exporter: Exporter) {
    super(exporter, 1);
  }

  public parse(node: HTMLElement): FileChild | FileChild[] | null {
    // 1) let the handler do all the splitting + measuring + formatting
    const paragraphHandler = new ParagraphHandler();
    const segments: SegmentInfo[] = paragraphHandler.segmentParagraph(node);

    // 2) turn each segment into a real docx.Paragraph
    const paras = segments.map(({ props }) => new Paragraph({ ...props }));

    // 3) if nothing came out, return null; otherwise return the array
    return paras.length ? paras : null;
  }

  // This static method ensures this parser only processes <p> elements.
  static matches(element: HTMLElement): boolean {
    return element.tagName === "P";
  }
}
