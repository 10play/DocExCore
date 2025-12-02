import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { A4_HEIGHT_PX } from "../core/hooks/useDocHeight";

export interface PageBadgeOverlayProps {
  pageGap: number;
  topOffsetPx?: number; // negative values move it up
  rightNudgePx?: number; // negative values move it further right
  label?: string;
  href?: string;
  firstPageExtraTopPx?: number; // additional top offset only for page 1
}

/**
 * Renders a small badge in the top-right header area of every page, aligned to the
 * white page content area. Uses CSS variables and layout constants for deterministic positioning.
 * No editor CSS is modified.
 */
export function PageBadgeOverlay({
  pageGap,
  topOffsetPx = 12,
  rightNudgePx = 12,
  label = "Made with ❤️ by 10play",
  href = "https://10play.dev",
  firstPageExtraTopPx = 32,
}: PageBadgeOverlayProps) {
  const [container, setContainer] = useState<HTMLElement | null>(null);
  const [pages, setPages] = useState<number>(1);

  // After mount, find the editor wrapper and its scroll container,
  // then keep the page count in sync with content height changes.
  useEffect(() => {
    const wrapper = document.querySelector(
      ".editor-wrapper"
    ) as HTMLElement | null;
    if (!wrapper) return;
    // Position overlays relative to the editor wrapper so horizontal scroll
    // keeps badges aligned with the page content.
    setContainer(wrapper);

    const computePages = () => {
      // Use clientHeight to reflect the actual rendered height (driven by --doc-height),
      // ensuring the overlay updates when the document shrinks as well as when it grows.
      const contentHeight = wrapper.clientHeight;
      const p = Math.max(
        1,
        Math.ceil((contentHeight + pageGap) / (A4_HEIGHT_PX + pageGap))
      );
      setPages(p);
    };

    computePages();
    const ro = new ResizeObserver(computePages);
    ro.observe(wrapper);
    return () => {
      ro.disconnect();
    };
  }, [pageGap]);

  const overlayNodes = useMemo(() => {
    if (!container) return null;
    return Array.from({ length: pages }).map((_, idx) => (
      <div
        key={`overlay-${idx}`}
        style={{
          position: "absolute",
          zIndex: 50,
          // Align horizontally with the white page area inside wrapper padding
          left: "var(--editor-padding)",
          top: `${
            idx * (A4_HEIGHT_PX + pageGap) +
            topOffsetPx +
            (idx === 0 ? firstPageExtraTopPx : 0)
          }px`,
          width: "calc(100% - var(--editor-padding) * 2)",
          pointerEvents: "none",
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "flex-end",
          }}
        >
          <a
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            title={new URL(href).host}
            style={{
              fontSize: 12,
              color: "#6b7280",
              textDecoration: "none",
              background: "rgba(255,255,255,0.9)",
              border: "1px solid #e6eaf2",
              borderRadius: 8,
              padding: "2px 6px",
              pointerEvents: "auto",
              marginRight: rightNudgePx,
            }}
          >
            {label}
          </a>
        </div>
      </div>
    ));
  }, [
    container,
    pages,
    pageGap,
    topOffsetPx,
    rightNudgePx,
    label,
    href,
    firstPageExtraTopPx,
  ]);

  if (!container || !overlayNodes) return null;
  return createPortal(overlayNodes, container);
}
