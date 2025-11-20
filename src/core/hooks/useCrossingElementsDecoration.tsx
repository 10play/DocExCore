import { useCallback, useEffect } from "react";
import { Editor } from "@tiptap/react";
import { updateDecorations } from "./updateDecorations";

export const useCrossingElementsDecoration = (
  editor: Editor | null,
  pageMargin: number,
  pageGap: number
) => {
  useEffect(() => {
    if (!editor) return;
    // console.log("useCrossingElementsDecoration", editor);
    // Initial calculation
    updateDecorations(editor, pageMargin, pageGap);

    // Set up a MutationObserver to watch for changes in the editor DOM;
    let previousHeight = Math.floor(editor.view.dom.clientHeight);
    const observer = new ResizeObserver((entries) => {
      entries.forEach((entry) => {
        const newHeight = Math.floor(entry.contentRect.height);
        if (newHeight !== previousHeight) {
          previousHeight = newHeight;
          updateDecorations(editor, pageMargin, pageGap);
        }
      });
    });

    // Observe changes to the editor DOM
    observer.observe(editor.view.dom);

    // Clean up
    return () => {
      observer.disconnect();
    };
  }, [editor, pageGap, pageMargin]);

  return useCallback(() => {
    updateDecorations(editor!, pageMargin, pageGap);
  }, [editor]);
};
