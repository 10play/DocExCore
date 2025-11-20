// src/extensions/BoundedListItem.ts
import { sinkListItem, liftListItem } from "prosemirror-schema-list";
import { ListItem } from "@tiptap/extension-list-item";

export const BoundedListItem = ListItem.extend<{
  maxDepth: number;
}>({
  name: "listItem", // override the built-in by using the same name

  addOptions() {
    return {
      ...this.parent?.(),
      maxDepth: 7,
    };
  },

  addCommands() {
    return {
      sinkListItem:
        () =>
        ({ state, dispatch }) => {
          const { $from } = state.selection;
          let depth = 0;
          for (let i = 0; i <= $from.depth; i++) {
            if ($from.node(i).type === this.type) depth++;
          }
          if (depth > this.options.maxDepth) {
            return false;
          }
          return sinkListItem(this.type)(state, dispatch);
        },

      /**
       * Also matches the original signature.  No depth check,
       * just always lift.
       */
      liftListItem:
        () =>
        ({ state, dispatch }) => {
          return liftListItem(this.type)(state, dispatch);
        },
    };
  },

  addKeyboardShortcuts() {
    return {
      Tab: () => this.editor.commands.sinkListItem("listItem"),
      "Shift-Tab": () => this.editor.commands.liftListItem("listItem"),
    };
  },
});
