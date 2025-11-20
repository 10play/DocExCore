import { Editor } from "@tiptap/react";
import { exportToDocx } from "./export/export";
export type ActiveNodeName =
  | "italic"
  | "strike"
  | "underline"
  | "bold"
  | "paragraph"
  | "heading"
  | "bulletList"
  | "orderedList"
  | "table";
export interface IEditorController {
  init(editor: Editor): void;

  isActive(name: ActiveNodeName): boolean;

  toggleBold(): void;
  toggleItalic(): void;
  toggleUnderline(): void;
  toggleStrike(): void;

  setParagraph(): void;
  toggleHeading(level: 1 | 2 | 3): void;
  toggleBulletList(): void;
  toggleOrderedList(): void;

  insertTable(rows?: number, cols?: number, withHeaderRow?: boolean): void;
  addColumnBefore(): void;
  addColumnAfter(): void;
  deleteColumn(): void;
  addRowBefore(): void;
  addRowAfter(): void;
  deleteRow(): void;
  mergeCells(): void;
  splitCell(): void;
  toggleHeaderCell(): void;
  deleteTable(): void;

  undo(): void;
  redo(): void;

  exportToDocx(fileName?: string): Promise<Blob>;
}
export class EditorController implements IEditorController {
  private editor: Editor | null = null;

  /** Called by the React wrapper once the Editor is created */
  init(editor: Editor) {
    this.editor = editor;
  }

  isActive(name: ActiveNodeName): boolean {
    return this.editor?.isActive(name) ?? false;
  }

  /** Marks */
  toggleBold() {
    this.editor?.chain().focus().toggleBold().run();
  }
  toggleItalic() {
    this.editor?.chain().focus().toggleItalic().run();
  }
  toggleUnderline() {
    this.editor?.chain().focus().toggleUnderline().run();
  }
  toggleStrike() {
    this.editor?.chain().focus().toggleStrike().run();
  }

  /** Blocks */
  setParagraph() {
    this.editor?.chain().focus().setParagraph().run();
  }
  toggleHeading(level: 1 | 2 | 3) {
    this.editor?.chain().focus().toggleHeading({ level }).run();
  }
  toggleBulletList() {
    this.editor?.chain().focus().toggleBulletList().run();
  }
  toggleOrderedList() {
    this.editor?.chain().focus().toggleOrderedList().run();
  }

  /** Table API */
  insertTable(rows = 3, cols = 3, withHeaderRow = true) {
    this.editor
      ?.chain()
      .focus()
      .insertTable({ rows, cols, withHeaderRow })
      .run();
  }
  addColumnBefore() {
    this.editor?.chain().focus().addColumnBefore().run();
  }
  addColumnAfter() {
    this.editor?.chain().focus().addColumnAfter().run();
  }
  deleteColumn() {
    this.editor?.chain().focus().deleteColumn().run();
  }
  addRowBefore() {
    this.editor?.chain().focus().addRowBefore().run();
  }
  addRowAfter() {
    this.editor?.chain().focus().addRowAfter().run();
  }
  deleteRow() {
    this.editor?.chain().focus().deleteRow().run();
  }
  mergeCells() {
    this.editor?.chain().focus().mergeCells().run();
  }
  splitCell() {
    this.editor?.chain().focus().splitCell().run();
  }
  toggleHeaderCell() {
    this.editor?.chain().focus().toggleHeaderCell().run();
  }
  deleteTable() {
    this.editor?.chain().focus().deleteTable().run();
  }

  /** History */
  undo() {
    this.editor?.chain().focus().undo().run();
  }
  redo() {
    this.editor?.chain().focus().redo().run();
  }

  /** Export to DOCX */
  async exportToDocx(fileName?: string, toDownload?: boolean) {
    if (!this.editor) throw new Error("Editor not ready");
    const wrapper = document.querySelector(".editor-wrapper");
    if (!(wrapper instanceof HTMLElement)) {
      throw new Error("Editor container not found");
    }
    return exportToDocx(wrapper, fileName, toDownload);
  }
}

export function getEditor() {
  return new EditorController();
}
