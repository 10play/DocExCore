import { useMemo, useState } from "react";
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
          Paragraph ${idx + 1}: Lorem ipsum dolor sit amet, consectetur adipiscing elit.
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
  const DocexEditor = useMemo(() => createDocexEditor(controller), [controller]);

  const [pageMargin, setPageMargin] = useState(96);
  const [pageGap, setPageGap] = useState(60);
  const [pagePadding, setPagePadding] = useState(96);

  const pxToCm = (value: number) => ((value / 96) * 2.54).toFixed(1);

  return (
    <div className="app-shell">
      <header className="app-header">
        <div>
          <h1>DocEx Core</h1>
          <p>Pagination + DOCX export extracted from the main product.</p>
        </div>
        <button
          className="export-button"
          onClick={() => controller.exportToDocx("docex-core-demo.docx", true)}
        >
          Export DOCX
        </button>
      </header>

      <section className="control-panel">
        <div className="format-group">
          <span className="group-title">Formatting</span>
          <div className="button-row">
            <button onClick={() => controller.toggleBold()}>Bold</button>
            <button onClick={() => controller.toggleItalic()}>Italic</button>
            <button onClick={() => controller.toggleUnderline()}>Underline</button>
            <button onClick={() => controller.toggleStrike()}>Strike</button>
            <button onClick={() => controller.toggleHeading(1)}>H1</button>
            <button onClick={() => controller.toggleHeading(2)}>H2</button>
            <button onClick={() => controller.toggleHeading(3)}>H3</button>
            <button onClick={() => controller.toggleBulletList()}>Bullet List</button>
            <button onClick={() => controller.toggleOrderedList()}>Numbered List</button>
            <button onClick={() => controller.insertTable(3, 3)}>Insert Table</button>
          </div>
        </div>

        <div className="format-group">
          <span className="group-title">Layout</span>
          <div className="slider-row">
            <label>
              Margin ({pxToCm(pageMargin)}cm)
              <input
                type="range"
                min={40}
                max={160}
                value={pageMargin}
                onChange={(event) => setPageMargin(Number(event.target.value))}
              />
            </label>
            <label>
              Padding ({pxToCm(pagePadding)}cm)
              <input
                type="range"
                min={40}
                max={160}
                value={pagePadding}
                onChange={(event) => setPagePadding(Number(event.target.value))}
              />
            </label>
            <label>
              Page Gap ({Math.round(pageGap)}px)
              <input
                type="range"
                min={20}
                max={120}
                value={pageGap}
                onChange={(event) => setPageGap(Number(event.target.value))}
              />
            </label>
          </div>
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
