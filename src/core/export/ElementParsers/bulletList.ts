import { ElementParser } from "./ElementParser";
import { FileChild } from "docx";
import { ListHandler } from "./listHandlerParser";
import { bulletConfig } from "./util/listConfig";
import { Exporter } from "../Exporter";

export class BulletListParser extends ElementParser {
  private handler = new ListHandler(bulletConfig);

  constructor(exporter: Exporter) {
    super(exporter, 4);
  }

  static matches(el: HTMLElement): boolean {
    return el.tagName === "UL";
  }

  public parse(element: HTMLElement, listInstance: number): FileChild[] {
    return this.handler.parse(element, listInstance, 0);
  }
}
