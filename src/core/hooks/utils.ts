import { SplitNodeAttribute } from "./types";

export const getComputedStyleValue = (
  element: HTMLElement,
  property: string
) => {
  return (
    element.computedStyleMap().get(property) as unknown as
      | {
          value: number;
        }
      | undefined
  )?.value;
};

export const getSplitNodeAttribute = (
  element: HTMLElement,
  attribute: SplitNodeAttribute
) => {
  const value = element.getAttribute(attribute);
  if (!value) {
    return undefined;
  }
  return Number(value);
};

export const getFirstChildMarginTop = (element: Node) => {
  if (element instanceof HTMLElement) {
    const child = element.children[0];
    if (child instanceof HTMLElement) {
      return getComputedStyleValue(child, "margin-top");
    }
  }
  return 0;
};

export const getSiblingMarginTop = (element: Node) => {
  if (element instanceof HTMLElement) {
    const sibling = element.nextSibling;
    if (sibling instanceof HTMLElement) {
      return (
        getComputedStyleValue(sibling, "margin-top") ||
        0 + (getFirstChildMarginTop(sibling) || 0)
      );
    }
  }
  return 0;
};

export const getDistanceFromNextSibling = (element: Node) => {
  if (element instanceof HTMLElement) {
    const sibling = element.nextSibling;
    if (sibling instanceof HTMLElement) {
      return sibling.offsetTop - element.offsetTop - element.offsetHeight;
    }
  }
  return 0;
};

export const hasNextSiblingMarginCollapse = (element: Node) => {
  if (element instanceof HTMLElement) {
    const distance = getDistanceFromNextSibling(element);
    const siblingMarginTop = getSiblingMarginTop(element);
    const currentMarginBottom = getComputedStyleValue(element, "margin-bottom");
    // if (element.textContent?.startsWith("Nam"))
    //   console.log(
    //     `Tag: ${element.tagName} Snippet: ${element.textContent?.slice(
    //       0,
    //       10
    //     )} Distance: ${distance} < SiblingMarginTop: ${siblingMarginTop} + (CurrentMarginBottom: ${currentMarginBottom} || 0)`
    //   );
    return distance < siblingMarginTop + (currentMarginBottom || 0);
  }
  return false;
};
