import { ElementParser } from "./ElementParsers/ElementParser";
import { OrderedListParser } from "./ElementParsers/OrderedListParser";
import { ParagraphParser } from "./ElementParsers/ParagraphParser";
import { Document, FileChild } from "docx";
import * as docx from "docx";
import { TableParser } from "./ElementParsers/TableParser";
import { BulletListParser } from "./ElementParsers/BulletListParser";
import {
  nextListInstance,
  resetListCounter,
} from "./ElementParsers/util/listCounter";
import {
  bulletList,
  numberedLevelList,
  unnumberedLevelList,
} from "./ElementParsers/util/listConfig";
import { HeadingParser } from "./ElementParsers/HeadingParser";

type ElementParserClass = (new (exporter: Exporter) => ElementParser) &
  Pick<typeof ElementParser, keyof typeof ElementParser>;

export class Exporter {
  private readonly parsers: ElementParserClass[] = [
    ParagraphParser,
    HeadingParser,
    OrderedListParser,
    TableParser,
    BulletListParser,
  ];

  constructor(private readonly document: HTMLElement) {}

  private getParser(element: HTMLElement) {
    return this.parsers.find((parser) => parser.matches(element));
  }

  public async export() {
    const children: FileChild[] = [];
    resetListCounter();
    for (const element of this.document.children) {
      if (!(element instanceof HTMLElement)) continue;
      // 1. parse the element into one or more FileChild
      const parsed = this.parse(element, nextListInstance());
      const parsedArray = Array.isArray(parsed)
        ? parsed
        : parsed
        ? [parsed]
        : [];

      children.push(...parsedArray);

      if (element.classList.contains("spacer")) {
        const last = children.at(-1);
        if (last instanceof docx.Paragraph) {
          last?.addChildElement(new docx.PageBreak());
        }
      }
    }

    const doc = new Document({
      numbering: {
        config: [numberedLevelList, unnumberedLevelList, bulletList],
      },
      sections: [
        {
          properties: {
            page: {
              size: {
                width: docx.convertInchesToTwip(8.7),
                height: docx.convertInchesToTwip(11.69),
              },
              margin: {
                top: docx.convertInchesToTwip(1),
                right: docx.convertInchesToTwip(1),
                bottom: docx.convertInchesToTwip(1),
                left: docx.convertInchesToTwip(1),
              },
            },
          },
          children,
        },
      ],
    });
    return doc;
  }

  public parse(
    element: HTMLElement,
    instance: number
  ): FileChild | Array<FileChild> {
    const Parser = this.getParser(element);
    if (!Parser) {
      console.warn("No parser found for element", element);
      return [];
    }

    const parser = new Parser(this);
    const parsedChildren = parser.parse(element, instance);

    return parsedChildren ?? [];
  }
}
