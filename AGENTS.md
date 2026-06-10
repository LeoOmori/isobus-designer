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
- `src/App.tsx` only wires hooks + panels together. Project mutation, selection, persistence, keyboard shortcuts, and picture-graphic sync live in dedicated hooks under `src/state/`.
- Project state lives in `src/state/useProjectState.ts`, persists to localStorage under `isobus-iop-editor-project`, and migrates stale saved objects on load.
- Selection state (single + multi) lives in `src/state/useSelection.ts`; object commands (create/delete/clone/patch) live in `src/state/useObjectCommands.ts`; z-order in `src/state/useLayerCommands.ts`. Background effects: `usePersistence`, `useKeyboardShortcuts`, `usePictureGraphicSync`.
- Core domain shape is `src/domain/types.ts`; ISO/VT constants and helpers are in `src/domain/isobus.ts` and `src/domain/vtPalette.ts`.
- Binary `.iop` export starts at `src/domain/export/exportObjectPool.ts`; writer dispatch goes through `src/objects/registry.ts`, while per-object writers live under `src/domain/export/writers/`.
- Object-specific architecture lives under `src/objects/<kind>/`; all current `ObjectKind`s plus the special Working Set have object modules, properties/render helpers, or tests under `src/objects/`.
- `src/domain/objectFactory.ts` delegates default object creation to `objectRegistry[kind].createDefault`; keep new object defaults in their `src/objects/<kind>/` module.
- Object property panels live on `objectRegistry[kind].Properties`. To declare which attribute / variable kinds an object can attach, add it to the `acceptsReferences` map in `src/objects/registry.ts`; runtime check is `acceptsReference(objectKind, refKind)`.
- Canvas object frame/content rendering is dispatched through `src/objects/canvasRenderRegistry.tsx`; keep object-specific render content and frame style decisions in object modules/registry instead of branching in `EditorCanvas.tsx`.
- Soft Key Mask strip rendering (slot grid + key-child placement) lives in `src/canvas/SoftKeyMaskStrip.tsx`; both Data Mask and Alarm Mask render paths reuse it.

## Object model gotchas
- Editor IDs like `DM_1` are distinct from ISO `objectId` hex strings; `objectFactory.toObjectId()` allocates from `0x0200 + nextNumber`, while export maps Working Set to `0x0000`.
- Parent/child consistency is enforced: children need both `parentId` and inclusion in the parent `childObjectIds`/`keys` array. Update both when moving or creating nested objects.
- Adding or changing an `ObjectKind` should be done as a `src/objects/<kind>/` module + a single entry in `src/objects/registry.ts`. Canvas-renderable kinds also need an entry in `src/objects/canvasRenderRegistry.tsx`.

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

### 6. Registries (2)
- `src/objects/registry.ts` — import the `<kind>Module` and the `<Kind>Properties` component, then add an entry through `compose(<kind>Module, <Kind>Properties)`. If the object accepts attribute / variable references, add its kind to the `acceptsReferences` map at the top of that file.
- `src/objects/canvasRenderRegistry.tsx` — import + add entry to `canvasObjectRenderers` (frameStyle + renderContent). Only needed for canvas-renderable kinds.

### 7. Editor wiring
- `src/state/useObjectCommands.ts`
  - Add to `CANVAS_KINDS` if it's a canvas-placeable child object
- `src/canvas/EditorCanvas.tsx`
  - Add to `CANVAS_TOOLS` if it's click-to-place on the canvas
  - Add to `CONTAINER_CHILD_TOOLS` if it can live inside containers
- `src/canvas/SoftKeyMaskStrip.tsx`
  - Add to `KEY_CHILD_TOOLS` if the tool can place children inside a Key slot

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
