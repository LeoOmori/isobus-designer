# Agent Notes

## Commands
- Use npm; this repo has `package-lock.json` and no pnpm/yarn workspace.
- `npm install` installs dependencies.
- `npm run dev` starts the Vite dev server.
- `npm run build` is the main verification command; it runs `tsc && vite build`.
- `npm test` runs pure-logic Vitest tests in Node; no jsdom/React Testing Library setup is configured yet.
- `npm run coverage` runs Vitest with V8 coverage.
- `npm run preview` serves the built `dist/` output.
- There are no lint or formatter scripts in `package.json`; do not assume lint commands exist.

## Structure
- Single-package Vite + React + TypeScript app; entrypoints are `index.html` -> `src/main.tsx` -> `src/App.tsx`.
- `src/App.tsx` owns the editor wiring: project state, selection, tool mode, object creation/deletion, export actions, and sidebar/canvas composition.
- Project state lives in `src/state/useProjectState.ts`, persists to localStorage under `isobus-iop-editor-project`, and migrates stale saved objects on load.
- Core domain shape is `src/domain/types.ts`; ISO/VT constants and helpers are in `src/domain/isobus.ts` and `src/domain/vtPalette.ts`.
- Binary `.iop` export starts at `src/domain/export/exportObjectPool.ts`; writer dispatch now goes through `src/objects/writerRegistry.ts`, while legacy per-object writers still live under `src/domain/export/writers/` until each kind is migrated.
- Object-specific architecture lives under `src/objects/<kind>/`; all current `ObjectKind`s plus the special Working Set now have object modules, properties/render helpers, or tests under `src/objects/`.
- `src/domain/objectFactory.ts` delegates default object creation to `extractedModules[kind].createDefault`; keep new object defaults in their `src/objects/<kind>/` module.
- Object property panels are dispatched through `src/objects/objectPropertyRegistry.tsx`; `referencePropertyRegistry.tsx` is only a compatibility re-export.
- Canvas object frame/content rendering is dispatched through `src/objects/canvasRenderRegistry.tsx`; keep object-specific render content and frame style decisions in object modules/registry instead of branching in `EditorCanvas.tsx`.

## Object model gotchas
- Editor IDs like `DM_1` are distinct from ISO `objectId` hex strings; `objectFactory.toObjectId()` allocates from `0x0200 + nextNumber`, while export maps Working Set to `0x0000`.
- Parent/child consistency is enforced: children need both `parentId` and inclusion in the parent `childObjectIds`/`keys` array. Update both when moving or creating nested objects.
- Adding or changing an `ObjectKind` should prefer the `src/objects/<kind>/` module pattern. Keep registry entries (`writerRegistry.ts`, `metaRegistry.tsx`) in sync; the old scattered whitelists still exist for not-yet-migrated kinds.
- Reference-only objects (`font/line/fill-attribute`, `string/number-variable`) have no canvas layout but are still exported and referenced by other objects.
- Picture graphics keep editor-only `sourceImageDataUrl` for re-quantization; export requires packed palette-indexed `rawData`. Key icons are forced/validated as 48×48, 8-bit, no flashing, positioned at x=6 y=6.

## Adding a new object kind

When implementing a new ISOBUS object kind, touch these files in order:

### 1. Type definitions
- `src/domain/types.ts`
  - Add `'your-kind'` to `ObjectKind` union
  - Add `'your-kind'` to `ToolMode` union if it's a placeable canvas object
  - Add any new fields to `EditorObject` (follow existing pattern)

### 2. ISO constants
- `src/domain/isobus.ts` — add `'your-kind': N` to `VT_OBJECT_TYPES`

### 3. Object module directory (`src/objects/<kind>/`)
- **`logic.ts`** — Export `meta`, `createDefault`, `validate`, and `module` object:
  ```ts
  export const objectMeta = { name, Icon, category, isReference, hasLayout } satisfies ObjectMeta;
  export function createDefault(ctx: CreateObjectContext): EditorObject { ... }
  export function validate(obj, project, lookup): string[] { ... }
  export const objectModule = { kind, meta, exportOrder: N, writer, createDefault, validate } satisfies ObjectModule<'your-kind'>;
  ```
- **`Render.tsx`** — React component for canvas content display
- **`Properties.tsx`** — React component for the property panel sidebar
- **`index.ts`** — Barrel file re-exporting module, renderer, properties

### 4. Export writer
- `src/domain/export/writers/<kind>.ts` — binary serialization function following the spec layout

### 5. Export smoke validator
- `src/domain/export/smokeValidateObjectPool.ts` — add a `case N:` to `parseObject()` with the correct field layout

### 6. Registries (all 5)
- `src/objects/writerRegistry.ts` — import + add to `writerModules`
- `src/objects/metaRegistry.tsx` — import + add to `metaRegistry`
- `src/objects/extractedModules.ts` — import + add to `extractedModules`
- `src/objects/objectPropertyRegistry.tsx` — import + add to `objectPropertyComponents`
- `src/objects/canvasRenderRegistry.tsx` — import + add entry to `canvasObjectRenderers` (frameStyle + renderContent)

### 7. Editor wiring
- `src/App.tsx`
  - Add to `CANVAS_KINDS` if it's a canvas-placeable child object
  - Update `canApplyReferencePatch()` if it can reference attributes/variables
- `src/canvas/EditorCanvas.tsx`
  - Add to `CANVAS_TOOLS` if it's click-to-place on the canvas
  - Add to `CONTAINER_CHILD_TOOLS` if it can live inside containers

### 8. UI tool & picker
- `src/panels/TopToolbar.tsx` — import lucide icon, add `<ToolButton>` in toolbar
- `src/panels/LeftSidebar.tsx` — import lucide icon, add `<PaletteCard>` in the appropriate section

### 9. IDs
- `src/objects/createHelpers.ts` — add `'your-kind': 'AB'` to `KIND_PREFIX`

### 10. Tests
- `tests/objects/registry.test.ts` — add to the `kinds` array and any canvas-renderable assertions
- `tests/objects/canvasRenderRegistry.test.ts` — add to the expected renderer kinds list
- Add new test file under `tests/objects/` if the kind has complex validation or export logic

After all changes, run `npm test && npm run build` to verify.

## Verification and generated output
- Prefer `npm test && npm run build` before handing off code changes.
- `dist/` is ignored build output; do not edit it directly.
