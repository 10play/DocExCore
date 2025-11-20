// src/parsers/ListHandler.ts
import { FileChild, Paragraph } from "docx";
import { ParagraphHandler } from "./paragraphHandler";
import { MAX_NESTING } from "./util/listConfig";
import { ListConfig, orderedConfig, bulletConfig } from "./util/listConfig";
import { nextListInstance } from "./util/listCounter";

export class ListHandler {
  private toBreakPageBefore = false;
  constructor(private config: ListConfig) {}

  public parse(
    listElement: HTMLElement,
    listInstance: number,
    nestingDepth: number = 0
  ): FileChild[] {
    const items = Array.from(listElement.children).filter(
      (child): child is HTMLElement => child instanceof HTMLElement
    );
    return items.flatMap((item) =>
      this.parseListItem(item, listInstance, nestingDepth)
    );
  }

  private parseListItem(
    li: HTMLElement,
    listInstance: number,
    nestingDepth: number
  ): FileChild[] {
    const out: FileChild[] = [];
    Array.from(li.children)
      .filter(
        (liElementChild): liElementChild is HTMLElement =>
          liElementChild instanceof HTMLElement
      )
      .forEach((child, idx) => {
        if (child.classList.contains("spacer")) {
          this.toBreakPageBefore = true;
        }

        if (child.tagName === "P") {
          const isFirst = idx === 0;
          const paras = this.handleParagraph(
            child,
            isFirst,
            listInstance,
            nestingDepth
          );
          out.push(...paras);
        }

        if (child.tagName === "OL" || child.tagName === "UL") {
          const nextConfig =
            child.tagName === "OL" ? orderedConfig : bulletConfig;
          const nextHandler = new ListHandler(nextConfig);
          out.push(
            ...nextHandler.parse(child, nextListInstance(), nestingDepth + 1)
          );
        }
      });
    return out;
  }

  private handleParagraph(
    pEl: HTMLElement,
    isFirstPara: boolean,
    listInstance: number,
    nestingDepth: number
  ): Paragraph[] {
    const handler = new ParagraphHandler();
    return handler.segmentParagraph(pEl).map(({ props }, segmentIndex) => {
      const effectiveFirst = isFirstPara || this.toBreakPageBefore;
      const isFirstSegment = segmentIndex === 0;

      const level = Math.min(nestingDepth, MAX_NESTING - 1);

      let numberingRef: string | undefined;
      if (isFirstSegment && effectiveFirst) {
        numberingRef = this.config.primaryRef;
      } else {
        numberingRef = this.config.nestedRef;
      }

      const opts = {
        ...props,
        ...(numberingRef && {
          numbering: { reference: numberingRef, level, instance: listInstance },
        }),
        pageBreakBefore: this.toBreakPageBefore,
      };
      this.toBreakPageBefore = false;
      return new Paragraph(opts);
    });
  }
}
