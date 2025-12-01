import { Extension } from "@tiptap/core";
import { Node } from "@tiptap/pm/model";
import { Plugin, PluginKey } from "@tiptap/pm/state";
import { Decoration, DecorationSet } from "@tiptap/pm/view";

export const decorationPluginKey = new PluginKey("redHighlightDecoration");

export const RedHighlightDecoration = Extension.create({
  name: "redHighlightDecoration",

  addProseMirrorPlugins() {
    return [
      new Plugin({
        key: decorationPluginKey,
        state: {
          init() {
            return { pageBreaks: [] } as {
              pageBreaks: { id: string; marginToFix: number }[];
            };
          },
          apply(tr, value) {
            const meta = tr.getMeta(decorationPluginKey);
            return meta ? meta : value;
          },
        },
        props: {
          decorations(state) {
            const pluginState = this.getState(state);
            const ids =
              pluginState?.pageBreaks.map((pageBreak) => pageBreak.id) || [];
            // Find the nodes
            const nodes: { node: Node; pos: number; marginToFix: number }[] =
              [];
            state.doc.descendants((node, pos) => {
              if (ids.includes(node.attrs.id)) {
                nodes.push({
                  node,
                  pos,
                  marginToFix:
                    pluginState?.pageBreaks.find(
                      (pageBreak) => pageBreak.id === node.attrs.id
                    )?.marginToFix || 0,
                });
              }
            });
            // For each node, add a decoration
            const newDecorations = nodes.flatMap((node) => {
              return [
                // eslint-disable-next-line @typescript-eslint/no-unused-vars
                Decoration.widget(node.pos, (_view, _getPos) => {
                  const spacer = document.createElement("div");
                  spacer.style.height = `${node.marginToFix}px`;
                  spacer.className = "spacer";
                  return spacer;
                }),
                Decoration.node(node.pos, node.pos + node.node.nodeSize, {
                  class: "red-highlight-decoration",
                  // style: `margin-top: ${elem.marginToFix + elem.originalMargin}px;`,
                  "data-margin-added": `${node.marginToFix}`,
                }),
              ];
            });

            // Create a new decoration set with only the current crossing elements
            const newDecorationSet = DecorationSet.create(
              state.doc,
              newDecorations
            );

            return nodes.length > 0 ? newDecorationSet : DecorationSet.empty;
          },
        },
      }),
    ];
  },
});

export default RedHighlightDecoration;
