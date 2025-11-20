import * as docx from "docx";

export interface ListConfig {
  tagName: "OL" | "UL";
  primaryRef: string;
  nestedRef: string;
}

export const orderedConfig: ListConfig = {
  tagName: "OL",
  primaryRef: "numbered-list",
  nestedRef: "unnumbered-list",
};

export const bulletConfig: ListConfig = {
  tagName: "UL",
  primaryRef: "bullet-list",
  nestedRef: "unnumbered-list",
};

export const MAX_NESTING = 8;
const baseIndent = docx.convertInchesToTwip(0.2);
const bulletChars = ["\u2022", "\u25CB", "\u25AA"];

export const bulletList = {
  reference: "bullet-list",
  levels: Array.from({ length: MAX_NESTING }, (_, lvl) => {
    const extraPerLevel = docx.convertInchesToTwip(0.4 * lvl);
    return {
      level: lvl,
      format: docx.LevelFormat.BULLET,
      // pick the glyph for this level, or fall back to the first one
      text: bulletChars[lvl] ?? bulletChars[2],
      alignment: docx.AlignmentType.START,
      style: {
        paragraph: {
          indent: {
            // indent 0.4" per level, with a hanging indent so the bullet hangs out
            left: baseIndent + extraPerLevel,
            hanging: baseIndent,
          },
        },
        run: {
          size: 32,
        },
      },
    };
  }),
};
export const numberedLevelList = {
  reference: "numbered-list",
  levels: Array.from({ length: MAX_NESTING }, (_, lvl) => {
    const extraPerLevel = docx.convertInchesToTwip(0.4 * lvl);
    return {
      level: lvl,
      format: docx.LevelFormat.DECIMAL,
      text: `%${lvl + 1}. `,
      alignment: docx.AlignmentType.START,
      style: {
        paragraph: {
          indent: {
            left: baseIndent + extraPerLevel,
            hanging: baseIndent,
          },
        },
        run: {
          size: 24,
        },
      },
    };
  }),
};
export const unnumberedLevelList = {
  reference: "unnumbered-list",
  levels: Array.from({ length: MAX_NESTING }, (_, lvl) => {
    const extraPerLevel = docx.convertInchesToTwip(0.4 * lvl);
    return {
      level: lvl,
      format: docx.LevelFormat.DECIMAL,
      text: ``,
      alignment: docx.AlignmentType.START,
      style: {
        paragraph: {
          indent: {
            left: baseIndent + extraPerLevel,
            hanging: baseIndent,
          },
        },
      },
    };
  }),
};
