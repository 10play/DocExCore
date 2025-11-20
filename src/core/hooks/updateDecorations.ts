import { Editor } from "@tiptap/react";
import { decorationPluginKey } from "../extensions/RedHighlightDecoration";
import { CrossingElement } from "./types";
import { A4_HEIGHT_PX } from "./useDocHeight";
import { getComputedStyleValue } from "./utils";

const blacklist = ["orderedList", "bulletList", "listItem", "table"]; // Will not be decorated instead will go to children
const parentBlocker = ["tableRow"]; // Will not go to children

export const updateDecorations = (
  editor: Editor,
  PAGE_MARGIN: number,
  PAGE_GAP: number
) => {
  const doc = editor.state.doc;
  // Reset crossing elements for this calculation
  const crossingElements: CrossingElement[] = [];

  // Traverse the document and log the y value of each node
  let curMargin = 0;
  const offsetTopDict: Record<string, boolean> = {};

  doc.nodesBetween(0, doc.content.size, (node, pos) => {
    // Ignore blacklisted nodes
    if (blacklist.includes(node.type.name)) return true;

    const pageRect = editor.view.dom.getBoundingClientRect();
    // get dom as pos
    const dom = editor.view.nodeDOM(pos);
    if (dom && dom instanceof HTMLElement) {
      const nodeBefore = dom.previousElementSibling as HTMLElement;
      const nodeBeforeIsSpacer = nodeBefore?.classList.contains("spacer");
      const marginTop = Math.ceil(
        getComputedStyleValue(dom, "margin-top") || 0
      );

      const marginBottom = getComputedStyleValue(dom, "margin-bottom") ?? 0;

      // We need to subtract any custom margin added, so that when calculating the offsetTop we don't include the custom margin
      // Get the node before
      if (nodeBeforeIsSpacer) {
        curMargin -=
          getComputedStyleValue(nodeBefore as HTMLElement, "height") ?? 0;
      }

      let offsetTop = 0;
      let offsetBottom = 0;
      if (node.type.name === "tableRow") {
        const tableRowRect = dom.getBoundingClientRect();
        offsetTop = Math.ceil(tableRowRect.top - pageRect.top + curMargin);
        offsetBottom = offsetTop + tableRowRect.height + PAGE_MARGIN;
      } else {
        // Get the position of the element relative to the editor container (top and bottom)
        offsetTop = Math.ceil(
          dom.offsetTop + // The top of the element relative to the editor container
            curMargin
        );

        offsetBottom =
          // Basically the offsetTop with the added height of the node, its margin bottom and page gaps/margin
          offsetTop + dom.offsetHeight + marginBottom + marginTop;
      }

      // Calculate which page the element is on
      const { isCrossing, startPage, endPage } = isNodeCrossing(
        offsetTop,
        offsetBottom,
        PAGE_MARGIN,
        PAGE_GAP
      );

      const usableHeight = A4_HEIGHT_PX - 2 * PAGE_MARGIN;
      const nodeHeight = dom.offsetHeight + marginTop + marginBottom;
      if (nodeHeight > usableHeight) {
        // Split paragraphs and headings
        if (node.type.name === "paragraph" || node.type.name === "heading") {
          const text = node.textContent || "";
          if (text.length > 1) {
            const mid = Math.floor(text.length / 2);
            // Try to split at a space near the middle
            let splitIdx = text.lastIndexOf(" ", mid);
            if (splitIdx === -1) splitIdx = mid;
            const first = text.slice(0, splitIdx).trim();
            const second = text.slice(splitIdx).trim();
            if (first && second) {
              const { schema } = editor;
              const newNodes = [
                schema.nodes[node.type.name].create({}, schema.text(first)),
                schema.nodes[node.type.name].create({}, schema.text(second)),
              ];
              const tr = editor.state.tr.replaceWith(
                pos,
                pos + node.nodeSize,
                newNodes
              );
              editor.view.dispatch(tr);
              return false; // Stop further traversal, doc has changed
            }
          }
        }
        return true; // do not treat it as crossing; no spacer added
      }

      if (isCrossing) {
        // The target offset top we want to reach is page the end of the content is on * A4_HEIGHT_PX + the initial margin top of the node
        const targetOffsetTop =
          (endPage + 1) * (A4_HEIGHT_PX + PAGE_GAP) + PAGE_MARGIN + marginTop;

        // The margin to fix is the difference between the target offset top and the current offset top + PAGE_MARGIN + PAGE_GAP
        const marginToFix = Math.ceil(targetOffsetTop - offsetTop);

        // Make sure to only count the margin once per offsetTop
        const marginCounted = offsetTopDict[offsetTop.toString()];
        if (!marginCounted) {
          curMargin += marginToFix;
          offsetTopDict[offsetTop.toString()] = true;
        }

        // Element crosses a page boundary
        crossingElements.push({
          from: pos,
          to: pos + node.nodeSize,
          startPage,
          endPage,
          marginToFix,
          crossingPoint: (startPage + 1) * A4_HEIGHT_PX, // The y-coordinate of the page break
          content: node.textContent?.slice(0, 10) ?? "",
          marginTop,
          node,
        });
        return false;
      } else if (parentBlocker.includes(node.type.name)) {
        return false;
      }
    }
  });

  // Create decorations for all crossing elements
  const pageBreaks = crossingElements.map((elem: CrossingElement) => {
    const id = elem.node.attrs.id;
    return {
      id,
      marginToFix: elem.marginToFix,
    };
  });

  // Dispatch decorations
  const tr = editor.state.tr.setMeta(decorationPluginKey, {
    pageBreaks,
  });
  // Apply the transaction to update the editor state
  editor.view.dispatch(tr);
};

export const isNodeCrossing = (
  offsetTop: number,
  offsetBottom: number,
  pageMargin: number,
  pageGap: number
) => {
  const pageHeight = A4_HEIGHT_PX + pageGap;
  // the page the node starts on
  const startPage = Math.floor(offsetTop / pageHeight);
  // the page the node ends on
  const endPage = Math.floor(offsetBottom / pageHeight);

  // where the content ends on the page
  const contentEnd = startPage * pageHeight + A4_HEIGHT_PX - pageMargin;

  const pageDiff = startPage !== endPage;
  const topCrossing = offsetTop > contentEnd;
  const bottomCrossing = offsetBottom > contentEnd;

  const isCrossing = topCrossing || bottomCrossing || pageDiff;

  return {
    isCrossing,
    startPage,
    endPage: pageDiff ? endPage - 1 : endPage,
  };
};
