export const computedStyleToNumber = (
  computed: string,
  unit: string = "px"
) => {
  switch (unit) {
    case "px":
    default:
      return parseFloat(computed.replace("px", ""));
  }
};

export const pxToTwips = (px: number) => {
  return px * 15;
};

export const ptToTwips = (pt: number) => {
  return pt * 20;
};

export const pxToPt = (px: number) => {
  return px / 1.333333;
};

export const CSS_FONT_TO_WORD_FONT = {
  Times: "Times New Roman",
  Arial: "Arial",
  "Courier New": "Courier New",
  Georgia: "Georgia",
  Garamond: "Garamond",
  Palatino: "Palatino",
  Aptos: "Aptos",
};
