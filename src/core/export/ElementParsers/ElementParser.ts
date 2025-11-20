import { FileChild } from "docx";
import { Exporter } from "../Exporter";

export abstract class ElementParser {
  constructor(
    /** the shared Exporter so sub-parsers can recurse */
    protected exporter: Exporter,
    /** ordering priority */
    protected priority: number
  ) {}
  abstract parse(
    element: HTMLElement,
    instance?: number
  ): FileChild | Array<FileChild> | null;

  /**
   * Check if the parser matches the element
   * @param element
   */
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  static matches(_element: HTMLElement): boolean {
    return true;
  }
}
