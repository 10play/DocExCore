import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import {
  RiArrowGoBackLine,
  RiArrowGoForwardLine,
  RiBold,
  RiItalic,
  RiUnderline,
  RiStrikethrough,
  RiListUnordered,
  RiListOrdered,
  RiTable2,
  RiAlignLeft,
  RiAlignCenter,
  RiAlignRight,
  RiDownloadLine,
  RiH1,
  RiH2,
  RiH3,
  RiParagraph,
} from "react-icons/ri/index.js";
import { createDocexEditor } from "../core/createDocexEditor";
import { PageBadgeOverlay } from "./PageBadgeOverlay";
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
  // no overlay state: compute overlays deterministically each render

  // Re-render on editor state changes so active toolbar buttons update
  useEffect(() => {
    return controller.onStateChange(() => {
      // Force a re-render so active classes update
      forceToolbarUpdate((v) => v + 1);
    });
  }, [controller]);

  // Table dropdown state (ONLY TABLE PART)
  const [showTableOptions, setShowTableOptions] = useState(false);
  const [tableGridSize, setTableGridSize] = useState({ rows: 0, cols: 0 });
  const tableDropdownRef = useRef<HTMLDivElement | null>(null);
  const tableDropdownPortalRef = useRef<HTMLDivElement | null>(null);
  const [tableDropdownPos, setTableDropdownPos] = useState<{
    top: number;
    left: number;
  } | null>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      const target = event.target as Node;
      const insideAnchor =
        tableDropdownRef.current && tableDropdownRef.current.contains(target);
      const insidePortal =
        tableDropdownPortalRef.current &&
        tableDropdownPortalRef.current.contains(target as Node);
      if (!insideAnchor && !insidePortal) {
        setShowTableOptions(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    if (!showTableOptions) return;
    const updatePosition = () => {
      const anchor = tableDropdownRef.current;
      if (!anchor) return;
      const rect = anchor.getBoundingClientRect();
      setTableDropdownPos({
        top: rect.bottom + 4,
        left: rect.left,
      });
    };
    updatePosition();
    window.addEventListener("resize", updatePosition);
    // capture scrolling on any ancestor
    window.addEventListener("scroll", updatePosition, true);
    return () => {
      window.removeEventListener("resize", updatePosition);
      window.removeEventListener("scroll", updatePosition, true);
    };
  }, [showTableOptions]);

  const toggleTableDropdown = () => {
    setShowTableOptions((prev) => {
      const next = !prev;
      if (!prev) {
        // opening: compute initial position
        const anchor = tableDropdownRef.current;
        if (anchor) {
          const rect = anchor.getBoundingClientRect();
          setTableDropdownPos({
            top: rect.bottom + 4,
            left: rect.left,
          });
        }
      }
      return next;
    });
  };

  const isTableActive = controller.isActive("table");
  const handleTableGridHover = (rows: number, cols: number) =>
    setTableGridSize({ rows, cols });

  // Per-page overlays are rendered by PageBadgeOverlay component

  return (
    <div className="app-shell">
      <section className="control-panel">
        <div className="toolbar">
          <div className="toolbar-center">
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
                  controller.isActive("paragraph") ? "active" : ""
                }`}
                aria-pressed={controller.isActive("paragraph")}
                title="Text"
                onClick={() => controller.setParagraph()}
              >
                <RiParagraph />
              </button>
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
              <button className="tool-button" title="Align left" disabled>
                <RiAlignLeft />
              </button>
              <button className="tool-button" title="Align center" disabled>
                <RiAlignCenter />
              </button>
              <button className="tool-button" title="Align right" disabled>
                <RiAlignRight />
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
              <div className="table-dropdown-container" ref={tableDropdownRef}>
                <button
                  className={`tool-button ${isTableActive ? "active" : ""}`}
                  title="Table options"
                  onClick={toggleTableDropdown}
                >
                  <RiTable2 />
                </button>
                {showTableOptions &&
                  tableDropdownPos &&
                  createPortal(
                    <div
                      className="table-dropdown"
                      ref={tableDropdownPortalRef}
                      style={{
                        position: "fixed",
                        top: tableDropdownPos.top,
                        left: tableDropdownPos.left,
                        zIndex: 1000,
                      }}
                    >
                      {!isTableActive ? (
                        <div className="table-grid-selector">
                          <div className="table-grid-label">Insert table</div>
                          <div className="table-grid">
                            {Array.from({ length: 5 }).map((_, rowIndex) => (
                              <div
                                key={`row-${rowIndex}`}
                                className="table-grid-row"
                              >
                                {Array.from({ length: 5 }).map(
                                  (_, colIndex) => (
                                    <button
                                      key={`cell-${rowIndex}-${colIndex}`}
                                      className={`table-grid-cell ${
                                        rowIndex <= tableGridSize.rows &&
                                        colIndex <= tableGridSize.cols
                                          ? "table-grid-cell-active"
                                          : ""
                                      }`}
                                      onMouseEnter={() =>
                                        handleTableGridHover(rowIndex, colIndex)
                                      }
                                      onClick={() => {
                                        controller.insertTable(
                                          rowIndex + 1,
                                          colIndex + 1,
                                          true
                                        );
                                        setShowTableOptions(false);
                                      }}
                                      title={`${rowIndex + 1}×${
                                        colIndex + 1
                                      } table`}
                                    />
                                  )
                                )}
                              </div>
                            ))}
                          </div>
                          <div className="table-dimensions-label">
                            {tableGridSize.rows > 0 && tableGridSize.cols > 0
                              ? `${tableGridSize.rows + 1}×${
                                  tableGridSize.cols + 1
                                } table`
                              : "Hover to select size"}
                          </div>
                        </div>
                      ) : (
                        <div className="table-controls">
                          <div className="table-controls-section">
                            <div className="table-controls-header">
                              Column actions
                            </div>
                            <button
                              className="table-menu-button"
                              onClick={() => {
                                controller.addColumnBefore();
                                setShowTableOptions(false);
                              }}
                              title="Add column before"
                            >
                              Add column before
                            </button>
                            <button
                              className="table-menu-button"
                              onClick={() => {
                                controller.addColumnAfter();
                                setShowTableOptions(false);
                              }}
                              title="Add column after"
                            >
                              Add column after
                            </button>
                            <button
                              className="table-menu-button destructive"
                              onClick={() => {
                                controller.deleteColumn();
                                setShowTableOptions(false);
                              }}
                              title="Delete column"
                            >
                              Delete column
                            </button>
                          </div>

                          <div className="table-controls-section">
                            <div className="table-controls-header">
                              Row actions
                            </div>
                            <button
                              className="table-menu-button"
                              onClick={() => {
                                controller.addRowBefore();
                                setShowTableOptions(false);
                              }}
                              title="Add row before"
                            >
                              Add row before
                            </button>
                            <button
                              className="table-menu-button"
                              onClick={() => {
                                controller.addRowAfter();
                                setShowTableOptions(false);
                              }}
                              title="Add row after"
                            >
                              Add row after
                            </button>
                            <button
                              className="table-menu-button destructive"
                              onClick={() => {
                                controller.deleteRow();
                                setShowTableOptions(false);
                              }}
                              title="Delete row"
                            >
                              Delete row
                            </button>
                          </div>

                          <div className="table-controls-section">
                            <div className="table-controls-header">
                              Cell actions
                            </div>
                            <button
                              className="table-menu-button"
                              onClick={() => {
                                controller.mergeCells();
                                setShowTableOptions(false);
                              }}
                              title="Merge cells"
                            >
                              Merge cells
                            </button>
                            <button
                              className="table-menu-button"
                              onClick={() => {
                                controller.splitCell();
                                setShowTableOptions(false);
                              }}
                              title="Split cell"
                            >
                              Split cell
                            </button>
                            <button
                              className="table-menu-button"
                              onClick={() => {
                                controller.toggleHeaderCell();
                                setShowTableOptions(false);
                              }}
                              title="Toggle header cell"
                            >
                              Toggle header cell
                            </button>
                          </div>

                          <div className="table-controls-section">
                            <div className="table-controls-header">
                              Table actions
                            </div>
                            <button
                              className="table-menu-button destructive"
                              onClick={() => {
                                controller.deleteTable();
                                setShowTableOptions(false);
                              }}
                              title="Delete table"
                            >
                              Delete table
                            </button>
                          </div>
                        </div>
                      )}
                    </div>,
                    document.body
                  )}
              </div>
              <button
                className="tool-button dark"
                title="Download DOCX"
                onClick={() =>
                  controller.exportToDocx("docex-core-demo.docx", true)
                }
              >
                <RiDownloadLine />
              </button>
            </div>
          </div>
          <div className="toolbar-right"></div>
        </div>
      </section>

      <main className="editor-panel">
        <DocexEditor
          content={initialContent}
          pageGap={pageGap}
          pageMargin={pageMargin}
          pagePadding={pagePadding}
        />
        <PageBadgeOverlay
          pageGap={pageGap}
          topOffsetPx={12}
          rightNudgePx={12}
          firstPageExtraTopPx={32}
        />
      </main>
    </div>
  );
}
