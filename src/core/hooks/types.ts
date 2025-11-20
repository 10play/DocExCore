import { Node } from "@tiptap/pm/model";

// Define the type for crossing elements
export interface CrossingElement {
  from: number;
  to: number;
  startPage: number;
  endPage: number;
  crossingPoint: number;
  marginToFix: number;
  marginTop: number;
  content: string;
  node: Node;
}

export enum SplitNodeAttribute {
  ORIGINAL_MARGIN = "data-original-margin",
  MARGIN_ADDED = "data-margin-added",
}
