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
- Object-specific architecture is being moved toward `src/objects/<kind>/`; `output-string` is the reference full vertical slice, and reference-only kinds (`font/line/fill-attribute`, `string/number-variable`) now have object modules, properties, and tests under `src/objects/`.

## Object model gotchas
- Editor IDs like `DM_1` are distinct from ISO `objectId` hex strings; `objectFactory.toObjectId()` allocates from `0x0200 + nextNumber`, while export maps Working Set to `0x0000`.
- Parent/child consistency is enforced: children need both `parentId` and inclusion in the parent `childObjectIds`/`keys` array. Update both when moving or creating nested objects.
- Adding or changing an `ObjectKind` should prefer the `src/objects/<kind>/` module pattern. Keep registry entries (`writerRegistry.ts`, `metaRegistry.tsx`) in sync; the old scattered whitelists still exist for not-yet-migrated kinds.
- Reference-only objects (`font/line/fill-attribute`, `string/number-variable`) have no canvas layout but are still exported and referenced by other objects.
- Picture graphics keep editor-only `sourceImageDataUrl` for re-quantization; export requires packed palette-indexed `rawData`. Key icons are forced/validated as 48×48, 8-bit, no flashing, positioned at x=6 y=6.

## Verification and generated output
- Prefer `npm test && npm run build` before handing off code changes.
- `dist/` is ignored build output; do not edit it directly.
