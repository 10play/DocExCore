# DocEx Core

This folder contains the stripped-down version of the DocEx editor showcasing only the pagination logic and the DOCX export pipeline. It is a self-contained Vite + React project that can become its own repository.

## What is included

- The `createDocexEditor` factory (`src/core/createDocexEditor.tsx`) which wires up TipTap with the custom pagination + decoration logic.
- The paginated layout helpers (`src/core/hooks`, `src/core/extensions`).
- The DOCX exporter (`src/core/export`) that mirrors the production exporter.
- A minimal controller (`src/core/editorController.ts`) exposing the commands used by the demo toolbar.
- A tiny example app in `src/example` that renders the editor, exposes a formatting toolbar, layout sliders, and a one-click DOCX export button.

## Getting started

```bash
cd docex-core
npm install
npm run dev
```

Visit http://localhost:5173 to use the demo. Updating the sliders shows the pagination logic in action, and the "Export DOCX" button downloads the generated document.

## Using the core editor elsewhere

```ts
import { createDocexEditor } from "./core/createDocexEditor";
import { EditorController } from "./core/editorController";

const controller = new EditorController();
const DocexEditor = createDocexEditor(controller);
```

Render `<DocexEditor />` wherever you need, and interact with the instance through `controller` (toggle formatting, insert tables, export, etc.). The factory accepts optional TipTap overrides if you want to register additional extensions.
