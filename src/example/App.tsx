import { useEffect, useMemo, useState } from "react";
import {
  RiArrowGoBackLine,
  RiArrowGoForwardLine,
  RiBold,
  RiItalic,
  RiUnderline,
  RiStrikethrough,
  RiH1,
  RiH2,
  RiH3,
  RiListUnordered,
  RiListOrdered,
  RiTable2,
} from "react-icons/ri/index.js";
import { createDocexEditor } from "../core/createDocexEditor";
import { EditorController } from "../core/editorController";
import "./example.css";

const initialContent = `
  <h1>DocEx Core Demo</h1>
  <p>
    This example shows the bare minimum required to get DocEx pagination and DOCX export working.
    The editor below uses the same TipTap extensions that power the production experience, but without
    any business-specific UI.
  </p>
  <p>
    Scroll through the document to see automatic page breaks, or tweak the layout controls to see how
    margins, padding, and gaps affect pagination.
  </p>
  <h2>Tables</h2>
  <p>Tables are fully supported and will automatically break across pages.</p>
  <table>
    <tr><th>Feature</th><th>Included</th></tr>
    <tr><td>Pagination logic</td><td>✅</td></tr>
    <tr><td>DOCX export</td><td>✅</td></tr>
    <tr><td>TipTap formatting</td><td>✅</td></tr>
  </table>
  <h2>Sample Content</h2>
  ${Array.from({ length: 15 })
    .map(
      (_, idx) => `
        <p>
          Paragraph ${
            idx + 1
          }: Lorem ipsum dolor sit amet, consectetur adipiscing elit.
          Ut ultricies orci at dolor pharetra, sed interdum mi bibendum. Duis vehicula
          ligula vitae neque gravida ullamcorper. Sed cursus ligula sit amet est
          scelerisque, id tempor leo viverra.
        </p>
      `
    )
    .join("\n")}
`;

export default function App() {
  const controller = useMemo(() => new EditorController(), []);
  const DocexEditor = useMemo(
    () => createDocexEditor(controller),
    [controller]
  );

  const [pageMargin] = useState(96);
  const [pageGap] = useState(60);
  const [, forceToolbarUpdate] = useState(0);
  const [pagePadding] = useState(96);

  // Re-render on editor state changes so active toolbar buttons update
  useEffect(() => {
    return controller.onStateChange(() => {
      // Force a re-render so active classes update
      forceToolbarUpdate((v) => v + 1);
    });
  }, [controller]);

  return (
    <div className="app-shell">
      <header className="app-header">
        <div>
          <h1>DocEx Core</h1>
          <p>Tiptap + Pagination + DOCX export</p>
        </div>
        <div className="header-actions">
          <button
            className="export-button"
            onClick={() =>
              controller.exportToDocx("docex-core-demo.docx", true)
            }
          >
            Export DOCX
          </button>
        </div>
      </header>

      <section className="control-panel">
        <div className="toolbar">
          <div className="toolbar-group">
            <button
              className="tool-button"
              title="Undo"
              onClick={() => controller.undo()}
            >
              <RiArrowGoBackLine />
            </button>
            <button
              className="tool-button"
              title="Redo"
              onClick={() => controller.redo()}
            >
              <RiArrowGoForwardLine />
            </button>
          </div>

          <div className="toolbar-sep" />

          <div className="toolbar-group">
            <button
              className={`tool-button ${
                controller.isActive("bold") ? "active" : ""
              }`}
              aria-pressed={controller.isActive("bold")}
              title="Bold"
              onClick={() => controller.toggleBold()}
            >
              <RiBold />
            </button>
            <button
              className={`tool-button ${
                controller.isActive("italic") ? "active" : ""
              }`}
              aria-pressed={controller.isActive("italic")}
              title="Italic"
              onClick={() => controller.toggleItalic()}
            >
              <RiItalic />
            </button>
            <button
              className={`tool-button ${
                controller.isActive("underline") ? "active" : ""
              }`}
              aria-pressed={controller.isActive("underline")}
              title="Underline"
              onClick={() => controller.toggleUnderline()}
            >
              <RiUnderline />
            </button>
            <button
              className={`tool-button ${
                controller.isActive("strike") ? "active" : ""
              }`}
              aria-pressed={controller.isActive("strike")}
              title="Strikethrough"
              onClick={() => controller.toggleStrike()}
            >
              <RiStrikethrough />
            </button>
          </div>

          <div className="toolbar-sep" />

          <div className="toolbar-group">
            <button
              className={`tool-button ${
                controller.isHeadingActive(1) ? "active" : ""
              }`}
              aria-pressed={controller.isHeadingActive(1)}
              title="Heading 1"
              onClick={() => controller.toggleHeading(1)}
            >
              <RiH1 />
            </button>
            <button
              className={`tool-button ${
                controller.isHeadingActive(2) ? "active" : ""
              }`}
              aria-pressed={controller.isHeadingActive(2)}
              title="Heading 2"
              onClick={() => controller.toggleHeading(2)}
            >
              <RiH2 />
            </button>
            <button
              className={`tool-button ${
                controller.isHeadingActive(3) ? "active" : ""
              }`}
              aria-pressed={controller.isHeadingActive(3)}
              title="Heading 3"
              onClick={() => controller.toggleHeading(3)}
            >
              <RiH3 />
            </button>
          </div>

          <div className="toolbar-sep" />

          <div className="toolbar-group">
            <button
              className={`tool-button ${
                controller.isActive("bulletList") ? "active" : ""
              }`}
              aria-pressed={controller.isActive("bulletList")}
              title="Bulleted list"
              onClick={() => controller.toggleBulletList()}
            >
              <RiListUnordered />
            </button>
            <button
              className={`tool-button ${
                controller.isActive("orderedList") ? "active" : ""
              }`}
              aria-pressed={controller.isActive("orderedList")}
              title="Numbered list"
              onClick={() => controller.toggleOrderedList()}
            >
              <RiListOrdered />
            </button>
          </div>

          <div className="toolbar-sep" />

          <div className="toolbar-group">
            <button
              className="tool-button"
              title="Insert table"
              onClick={() => controller.insertTable(3, 3)}
            >
              <RiTable2 />
            </button>
          </div>

          <div className="toolbar-sep" />

          {/* layout controls removed */}
        </div>
      </section>

      <main className="editor-panel">
        <DocexEditor
          content={initialContent}
          pageGap={pageGap}
          pageMargin={pageMargin}
          pagePadding={pagePadding}
        />
      </main>
    </div>
  );
}
