# DocEx Core

This folder contains the stripped-down version of the DocEx editor showcasing only the pagination logic and the DOCX export pipeline. It is a self-contained Vite + React project that can become its own repository.

## What is included

### Core editor (`src/core`)

- `createDocexEditor.tsx` – React factory that builds the TipTap editor with our pagination hooks and RedHighlight decoration. Consumers pass in an `EditorController` and optionally override TipTap props/extensions.
- `editorController.ts` – thin wrapper around TipTap’s command chain that exposes the features shown in the toolbar (marks, blocks, tables, undo/redo, export).
- `hooks` – pagination + layout utilities:
  - `useDocHeight` keeps track of document height so we can render the faux page gaps.
  - `useCrossingElementsDecoration` highlights elements that cross page boundaries.
- `extensions` – custom TipTap extensions. For example, `BoundedListItem` prevents lists from nesting too deeply, and `RedHighlightDecoration` paints validation errors.
- `export` – DOCX export pipeline copied from production. `exportToDocx` walks the rendered DOM and emits a `.docx` blob. Nothing in here is demo-specific, so you can use it in other apps.

### Styling (`src/css`)

- `editor.css` – base editor surface styles (A4 page size, fonts, etc.).
- `table.css` – table-specific styles shared between the editor and the exporter.
- `index.css` – document-level resets used by the Vite app shell.

### Example (`src/example`)

- `App.tsx` – minimal shell that shows how to wire the controller into UI (toolbar buttons, layout sliders, DOCX export button) plus a sample document.
- `example.css` – styles for the shell + toolbar/ribbon UI. This file is intentionally separate so you can swap it out without affecting TipTap.

### Entrypoint (`src/main.tsx`)

Bootstraps React, loads the shared CSS, and renders the example app. Replace it with your own app entry if you embed the editor elsewhere.

## Getting started

```bash
cd docex-core
npm install
npm run dev
```

Visit http://localhost:5173 to use the demo. Updating the sliders shows the pagination logic in action, and the "Export DOCX" button downloads the generated document.

If you run into TypeScript errors coming from the TipTap packages during `npm run build`, you can either relax the `tsconfig` strictness or pin the same versions used in production.

## Using the core editor elsewhere

```ts
import { createDocexEditor } from "./core/createDocexEditor";
import { EditorController } from "./core/editorController";

const controller = new EditorController();
const DocexEditor = createDocexEditor(controller);
```

Render `<DocexEditor />` wherever you need, and interact with the instance through `controller` (toggle formatting, insert tables, export, etc.). The factory accepts optional TipTap overrides if you want to register additional extensions.

The bundled pieces are intentionally decoupled: you can import only the controller or exporter, swap out the toolbar UI, or mount the editor inside any React render tree.
