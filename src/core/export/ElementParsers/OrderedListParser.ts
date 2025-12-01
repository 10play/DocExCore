import { ElementParser } from "./ElementParser";
import { FileChild } from "docx";
import { ListHandler } from "./ListHandler";
import { orderedConfig } from "./util/listConfig";
import { Exporter } from "../Exporter";

export class OrderedListParser extends ElementParser {
  private handler = new ListHandler(orderedConfig);

  constructor(exporter: Exporter) {
    super(exporter, 3);
  }

  static matches(el: HTMLElement): boolean {
    return el.tagName === "OL";
  }

  public parse(element: HTMLElement, listInstance: number): FileChild[] {
    return this.handler.parse(element, listInstance, 0);
  }
}
