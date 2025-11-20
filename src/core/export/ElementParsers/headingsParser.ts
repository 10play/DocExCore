// src/parsers/HeadingParser.ts
import { ElementParser } from "./ElementParser";
import { FileChild, Paragraph } from "docx";
import { ParagraphHandler } from "./paragraphHandler";
import { Exporter } from "../Exporter";

/**
 * Turn <h1>, <h2>, <h3> into styled docx headings.
 */
export class HeadingParser extends ElementParser {
  constructor(exporter: Exporter) {
    super(exporter, 5);
  }

  static matches(element: HTMLElement): boolean {
    return (
      element.tagName === "H1" ||
      element.tagName === "H2" ||
      element.tagName === "H3"
    );
  }

  public parse(element: HTMLElement): FileChild[] {
    const level = parseInt(element.tagName.charAt(1), 10);
    const styleName = `Heading${level}`;

    const handler = new ParagraphHandler();
    return handler.segmentParagraph(element).map(({ props }) => {
      return new Paragraph({
        ...props,
        style: styleName,
      });
    });
  }
}
