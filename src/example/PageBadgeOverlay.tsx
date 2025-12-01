import { useEffect, useMemo } from "react";
import { createPortal } from "react-dom";
import { A4_HEIGHT_PX } from "../core/hooks/useDocHeight";

export interface PageBadgeOverlayProps {
  pageGap: number;
  topOffsetPx?: number; // negative values move it up
  rightNudgePx?: number; // negative values move it further right
  label?: string;
  href?: string;
}

/**
 * Renders a small badge in the top-right header area of every page, aligned to the
 * white page content area. Uses CSS variables and layout constants for deterministic positioning.
 * No editor CSS is modified.
 */
export function PageBadgeOverlay({
  pageGap,
  topOffsetPx = -25,
  rightNudgePx = -37,
  label = "Made with ❤️ by 10play",
  href = "https://10play.dev",
}: PageBadgeOverlayProps) {
  // A very light re-render hook in case the doc height changes due to edits
  useEffect(() => {
    // noop: re-render will be driven by parent updates; kept for future extensibility
  }, [pageGap]);

  return useMemo(() => {
    const wrapper = document.querySelector(".editor-wrapper") as HTMLElement | null;
    const scroller = wrapper?.parentElement as HTMLElement | null;
    if (!scroller) return null;

    const rootStyles = getComputedStyle(document.documentElement);
    const editorMargin = rootStyles.getPropertyValue("--editor-margin") || "0px";
    const contentHeight = wrapper?.scrollHeight ?? 0;
    const pages = Math.max(
      1,
      Math.ceil((contentHeight + pageGap) / (A4_HEIGHT_PX + pageGap))
    );

    const overlayNodes = Array.from({ length: pages }).map((_, idx) => (
      <div
        key={`overlay-${idx}`}
        style={{
          position: "absolute",
          zIndex: 10,
          left: "50%",
          transform: "translateX(-50%)",
          top: `calc(${editorMargin} + ${idx * (A4_HEIGHT_PX + pageGap)}px + ${topOffsetPx}px)`,
          width: "calc(8.27in - var(--editor-padding) * 2)",
          pointerEvents: "none",
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "flex-end",
            paddingRight: "var(--editor-padding)",
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
    return createPortal(overlayNodes, scroller);
  }, [pageGap, topOffsetPx, rightNudgePx, label, href]);
}


