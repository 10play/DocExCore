import { Editor } from "@tiptap/react";

// const A4_HEIGHT_CM = 29.7;
export const A4_HEIGHT_PX = Math.round(11.69 * 96);

// Throttle function to limit the execution rate
const throttle = (func: (editor: Editor) => void, limit: number) => {
  let lastFunc: ReturnType<typeof setTimeout>;
  let lastRan: number;
  return function (this: void, ...args: [Editor]) {
    if (!lastRan || Date.now() - lastRan >= limit) {
      func.apply(this, args);
      lastRan = Date.now();
    } else {
      clearTimeout(lastFunc);
      lastFunc = setTimeout(() => {
        func.apply(this, args);
        lastRan = Date.now();
      }, limit - (Date.now() - lastRan));
    }
  };
};

// Throttle the useDocHeight function
// @ts-expect-error wierd ts issue
export const useDocHeight = throttle((editor: Editor, pageGap: number) => {
  // Round to prevent multiple pages
  const docHeight = Math.round(editor.view.dom.scrollHeight);
  // get the nearest cieled number of A4 pages
  const pages = Math.ceil((docHeight + pageGap) / (A4_HEIGHT_PX + pageGap));
  // the new max height is the height of the editor + the height of the pages
  const minHeight = pages * A4_HEIGHT_PX + pages * pageGap - pageGap;

  // update css var --doc-height with the new max height
  document.documentElement.style.setProperty("--doc-height", `${minHeight}px`);
}, 200); // Adjust the limit as needed
