import { useEffect, useMemo, type CSSProperties } from "react";
import {
  EditorContent,
  useEditor as useTipTapEditor,
  Editor,
} from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Underline from "@tiptap/extension-underline";
import Table from "@tiptap/extension-table";
import TableRow from "@tiptap/extension-table-row";
import TableHeader from "@tiptap/extension-table-header";
import TableCell from "@tiptap/extension-table-cell";
// @ts-expect-error extension is not typed
import UniqueId from "tiptap-unique-id";
import { BoundedListItem } from "./extensions/BoundedListItem";
import RedHighlightDecoration from "./extensions/RedHighlightDecoration";
import { useDocHeight, A4_HEIGHT_PX } from "./hooks/useDocHeight";
import { useCrossingElementsDecoration } from "./hooks/useCrossingElementsDecoration";
import { EditorController } from "./editorController";

export interface DocexEditorProps {
  content?: string;
  style?: CSSProperties;
  className?: string;
  pageMargin?: number;
  pageGap?: number;
  pagePadding?: number;
}

export function createDocexEditor(controller: EditorController) {
  return function DocexEditor({
    content = "",
    style = {},
    className,
    pageMargin = 96,
    pageGap = 76,
    pagePadding = 96,
  }: DocexEditorProps) {
    const defaultExtensions = useMemo(
      () => [
        StarterKit,
        BoundedListItem,
        Underline,
        Table.configure({ resizable: true }),
        TableRow,
        TableHeader,
        TableCell,
        RedHighlightDecoration,
        UniqueId.configure({
          attributeName: "id",
          types: [
            "paragraph",
            "heading",
            "orderedList",
            "bulletList",
            "listItem",
            "table",
            "tableRow",
            "tableHeader",
            "tableCell",
          ],
          createId: () => Math.random().toString(36).slice(2),
        }),
      ],
      []
    );

    const editor = useTipTapEditor({
      extensions: defaultExtensions,
      content,
      editorProps: {
        attributes: {
          class: ["editor", className].join(" "),
        },
      },
    });

    useEffect(() => {
      if (!editor) return;
      controller.init(editor as Editor);
    }, [controller, editor]);

    // @ts-expect-error hack to set the height of the editor
    useDocHeight(editor as Editor, pageGap);
    useCrossingElementsDecoration(editor as Editor, pageMargin, pageGap);

    useEffect(() => {
      document.documentElement.style.setProperty(
        "--editor-padding",
        `${pagePadding}px`
      );
      document.documentElement.style.setProperty(
        "--editor-margin",
        `${pageMargin}px`
      );
    }, [pagePadding, pageMargin]);

    if (!editor) return null;

    const pageCount = Math.ceil(editor.view.dom.clientHeight / A4_HEIGHT_PX);

    return (
      <div
        style={{
          background: "#f8f9fa",
          height: "100%",
          width: "100%",
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
          ...style,
        }}
      >
        <div
          style={{
            position: "relative",
            flex: 1,
            display: "flex",
            overflowY: "auto",
            overflowX: "auto",
            paddingTop: 40,
          }}
        >
          <EditorContent editor={editor} className="editor-wrapper" />
          {Array.from({ length: pageCount }).map((_, idx) => (
            <div
              key={`page-gap-${idx}`}
              style={{
                position: "absolute",
                top: `${(idx + 1) * (A4_HEIGHT_PX + pageGap) - pageGap}px`,
                width: "100%",
                height: pageGap,
                background: "#f8f9fa",
              }}
            />
          ))}
        </div>
      </div>
    );
  };
}
