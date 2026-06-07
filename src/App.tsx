import { useEffect, useState } from 'react';
import { EditorCanvas } from './canvas/EditorCanvas';
import { clamp } from './domain/isobus';
import { initialProject } from './domain/initialProject';
import { createEditorObject, referencePatch } from './domain/objectFactory';
import type { EditorObject, ObjectKind, ReferenceKind, ToolMode, Viewport, WorkingSet } from './domain/types';
import { validate } from './domain/validation';
import {
  asPictureGraphicFormat,
  clearUnsupportedPictureGraphicOptions,
  derivedPictureGraphicHeight,
  expectedPictureGraphicRawDataLength,
  quantizePictureGraphicSource,
} from './domain/vtPalette';
import { defaultIopFilename, downloadIopFile } from './domain/export/downloadIop';
import { exportObjectPool } from './domain/export/exportObjectPool';
import { ExportErrorsDialog } from './panels/ExportErrorsDialog';
import { LeftSidebar } from './panels/LeftSidebar';
import { RightSidebar } from './panels/RightSidebar';
import { TopToolbar } from './panels/TopToolbar';
import { storageKey, useProjectState } from './state/useProjectState';

/** Kinds that are placed as children of a Data Mask on the canvas. */
const CANVAS_KINDS = new Set<ObjectKind>([
  'container', 'output-string', 'output-number', 'output-rectangle', 'button', 'picture-graphic',
]);

export function App() {
  const { project, setProject, commit, undo, redo, canUndo, canRedo } = useProjectState();
  const [selectedId, setSelectedId] = useState(project.activeMaskId || project.workingSet.id);
  const [tool, setTool] = useState<ToolMode>('select');
  const [viewport, setViewport] = useState<Viewport>({ x: 200, y: 100, zoom: 0.85 });
  const [exportErrors, setExportErrors] = useState<string[] | null>(null);
  const [sidebarsVisible, setSidebarsVisible] = useState(true);
  const errors = validate(project);

  const masks       = project.objects.filter((o) => o.kind === 'data-mask');
  const softKeyMasks = project.objects.filter((o) => o.kind === 'soft-key-mask');

  // ── Persistence ───────────────────────────────────────────────────────
  useEffect(() => {
    const id = window.setInterval(() => window.localStorage.setItem(storageKey, JSON.stringify(project)), 30_000);
    return () => window.clearInterval(id);
  }, [project]);

  // Convert migrated/stale editor source images into spec-compliant indexed rawData
  // even when the Picture Graphic property panel is not open.
  useEffect(() => {
    const objectById = new Map(project.objects.map((object) => [object.id, object]));
    const pending = project.objects
      .filter((object) => {
        if (object.kind !== 'picture-graphic' || !object.sourceImageDataUrl) return false;
        const parent = object.parentId ? objectById.get(object.parentId) : undefined;
        const isKeyIcon = parent?.kind === 'key';
        const format = asPictureGraphicFormat(object.graphicFormat);
        const expectedWidth = isKeyIcon ? 48 : object.actualWidth ?? 0;
        const expectedHeight = isKeyIcon ? 48 : object.actualHeight ?? 0;
        const expectedLength = expectedPictureGraphicRawDataLength(expectedWidth, expectedHeight, format);
        return object.rawData?.length !== expectedLength
          || (isKeyIcon && (
            object.actualWidth !== 48 || object.actualHeight !== 48 ||
            object.targetWidth !== 48 || object.x !== 6 || object.y !== 6
          ));
      })
      .map((object) => ({
        id: object.id,
        sourceImageDataUrl: object.sourceImageDataUrl!,
        isKeyIcon: object.parentId ? objectById.get(object.parentId)?.kind === 'key' : false,
        format: asPictureGraphicFormat(object.graphicFormat),
        options: clearUnsupportedPictureGraphicOptions(object.graphicOptions ?? 0),
        transparencyColor: object.transparencyColor ?? 0,
      }));

    if (!pending.length) return;

    let cancelled = false;
    void Promise.all(pending.map(async (item) => ({
      ...item,
      quantized: await quantizePictureGraphicSource(
        item.sourceImageDataUrl,
        item.format,
        item.options,
        item.transparencyColor,
        item.isKeyIcon ? 48 : undefined,
        item.isKeyIcon ? 48 : undefined,
      ),
    }))).then((results) => {
      if (cancelled) return;
      setProject((current) => ({
        ...current,
        objects: current.objects.map((object) => {
          const result = results.find((item) => item.id === object.id);
          if (!result || object.kind !== 'picture-graphic') return object;
          if (
            object.sourceImageDataUrl !== result.sourceImageDataUrl ||
            asPictureGraphicFormat(object.graphicFormat) !== result.format ||
            clearUnsupportedPictureGraphicOptions(object.graphicOptions ?? 0) !== result.options ||
            (object.transparencyColor ?? 0) !== result.transparencyColor
          ) return object;

          const targetWidth = result.isKeyIcon ? 48 : object.targetWidth ?? object.width ?? result.quantized.actualWidth;
          return {
            ...object,
            ...result.quantized,
            graphicFormat: result.format,
            graphicOptions: result.options,
            targetWidth,
            width: targetWidth,
            height: derivedPictureGraphicHeight(targetWidth, result.quantized.actualWidth, result.quantized.actualHeight),
            x: result.isKeyIcon ? 6 : object.x,
            y: result.isKeyIcon ? 6 : object.y,
          };
        }),
      }));
    });

    return () => { cancelled = true; };
  }, [project.objects, setProject]);

  // ── Keyboard shortcuts ────────────────────────────────────────────────
  useEffect(() => {
    function handler(event: KeyboardEvent) {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'z') {
        event.preventDefault();
        if (event.shiftKey) redo(); else undo();
      }
    }
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [redo, undo]);

  // ── Patches ───────────────────────────────────────────────────────────
  function patchObject(id: string, changes: Partial<EditorObject>) {
    commit((current) => ({
      ...current,
      objects: current.objects.map((o) => o.id === id ? { ...o, ...changes } : o),
    }));
  }

  function patchWorkingSet(changes: Partial<WorkingSet>) {
    commit((current) => {
      const activeDataMaskId = changes.activeDataMaskId ?? current.workingSet.activeDataMaskId;
      return {
        ...current,
        activeMaskId: activeDataMaskId || current.activeMaskId,
        workingSet: { ...current.workingSet, ...changes },
      };
    });
    if (changes.activeDataMaskId) setSelectedId(changes.activeDataMaskId);
  }

  // ── Object creation ───────────────────────────────────────────────────
  function createObject(kind: ObjectKind, x = 70, y = 70, parentId = project.activeMaskId) {
    commit((current) => {
      const isMask      = kind === 'data-mask';
      const isSKM       = kind === 'soft-key-mask';
      const isKey       = kind === 'key';
      const isCanvas    = CANVAS_KINDS.has(kind);

      // Which Data Mask or Button to append this canvas child to.
      const targetParentId = isCanvas ? parentId : current.activeMaskId;
      const activeSKMId  = current.workingSet.activeSoftKeyMaskId;
      const next        = createEditorObject(kind, current, x, y, targetParentId);

      setSelectedId(next.id);

      return {
        ...current,
        activeMaskId: isMask ? next.id : current.activeMaskId,
        workingSet: {
          ...current.workingSet,
          activeDataMaskId:     isMask ? next.id : current.workingSet.activeDataMaskId,
          activeSoftKeyMaskId:  isSKM  ? next.id : current.workingSet.activeSoftKeyMaskId,
        },
        nextNumber: current.nextNumber + 1,
        objects: [
          ...current.objects.map((o) => {
            // Add canvas child to Data Mask/Button childObjectIds.
            if (isCanvas && o.id === targetParentId) {
              return { ...o, childObjectIds: [...(o.childObjectIds ?? []), next.id] };
            }
            // Add key to soft key mask keys array
            if (isKey && o.id === activeSKMId) {
              return { ...o, keys: [...(o.keys ?? []), next.id] };
            }
            // Link a newly created Soft Key Mask to the active Data Mask by default.
            if (isSKM && o.kind === 'data-mask' && o.id === current.activeMaskId && !o.softKeyMaskId) {
              return { ...o, softKeyMaskId: next.id };
            }
            return o;
          }),
          next,
        ],
      };
    });
  }

  function createAttributeReference(kind: ReferenceKind) {
    commit((current) => {
      const attribute = createEditorObject(kind, current);
      return {
        ...current,
        nextNumber: current.nextNumber + 1,
        objects: current.objects.map((o) =>
          o.id === selectedId && canApplyReferencePatch(o, kind)
            ? { ...o, ...referencePatch(kind, attribute.id) }
            : o,
        ).concat(attribute),
      };
    });
  }

  function canApplyReferencePatch(object: EditorObject, kind: ReferenceKind) {
    if (kind === 'font-attribute') return object.kind === 'output-string' || object.kind === 'output-number';
    if (kind === 'string-variable') return object.kind === 'output-string';
    if (kind === 'number-variable') return object.kind === 'output-number';
    if (kind === 'line-attribute' || kind === 'fill-attribute') return object.kind === 'output-rectangle';
    return false;
  }

  // ── Deletion ──────────────────────────────────────────────────────────
  function deleteObject(id: string) {
    const object = project.objects.find((o) => o.id === id);
    if (!object) return;
    // Prevent deleting the last data mask
    if (object.kind === 'data-mask' && project.objects.filter((o) => o.kind === 'data-mask').length === 1) return;

    commit((current) => {
      const deleteIds = new Set<string>();
      const objectById = new Map(current.objects.map((candidate) => [candidate.id, candidate]));

      function collectDeleted(currentId: string) {
        if (deleteIds.has(currentId)) return;
        deleteIds.add(currentId);
        const currentObject = objectById.get(currentId);
        for (const childId of currentObject?.childObjectIds ?? []) collectDeleted(childId);
        for (const keyId of currentObject?.keys ?? []) collectDeleted(keyId);
      }

      collectDeleted(id);
      const objects = current.objects
        .filter((o) => !deleteIds.has(o.id))
        .map((o) => {
          if (o.childObjectIds) {
            return { ...o, childObjectIds: o.childObjectIds?.filter((c) => !deleteIds.has(c)) };
          }
          if (o.kind === 'soft-key-mask') {
            return { ...o, keys: o.keys?.filter((k) => !deleteIds.has(k)) };
          }
          return o;
        });

      const activeMaskId = deleteIds.has(current.activeMaskId)
        ? objects.find((o) => o.kind === 'data-mask')?.id ?? ''
        : current.activeMaskId;

      setSelectedId(activeMaskId || current.workingSet.id);
      return { ...current, activeMaskId, workingSet: { ...current.workingSet, activeDataMaskId: activeMaskId }, objects };
    });
  }

  // ── Layering ──────────────────────────────────────────────────────────
  function layer(action: 'front' | 'back' | 'forward' | 'backward') {
    const selected = project.objects.find((o) => o.id === selectedId);
    if (!selected || selected.kind === 'data-mask') return;
    const parent = selected.parentId
      ? project.objects.find((o) => o.id === selected.parentId)
      : project.objects.find((o) => o.id === project.activeMaskId);
    const siblingIds = parent?.kind === 'soft-key-mask' ? parent.keys ?? [] : parent?.childObjectIds ?? [];
    const siblings = project.objects.filter((o) => siblingIds.includes(o.id));
    if (!siblings.length) return;
    const max = Math.max(...siblings.map((o) => o.zIndex));
    const min = Math.min(...siblings.map((o) => o.zIndex));
    const next = action === 'front'    ? max + 1
               : action === 'back'     ? min - 1
               : action === 'forward'  ? selected.zIndex + 1
               : selected.zIndex - 1;
    patchObject(selected.id, { zIndex: next });
  }

  // ── IOP Export ───────────────────────────────────────────────────────
  function handleExportIop() {
    const { bytes, errors: exportErrs } = exportObjectPool(project);
    if (exportErrs.length > 0) {
      setExportErrors(exportErrs);
      return;
    }
    downloadIopFile(bytes, defaultIopFilename(project));
  }

  // ── Render ────────────────────────────────────────────────────────────
  return (
    <div className="app-shell">
      <TopToolbar
        tool={tool}
        onToolChange={setTool}
        zoom={viewport.zoom}
        onZoom={(zoom) => setViewport({ ...viewport, zoom: clamp(zoom, 0.25, 3) })}
        onExportIop={handleExportIop}
        sidebarsVisible={sidebarsVisible}
        onToggleSidebars={() => setSidebarsVisible((v) => !v)}
      />
      <div className={`workspace ${sidebarsVisible ? '' : 'sidebars-hidden'}`}>
        <LeftSidebar
          tool={tool}
          onToolChange={(next) => next === 'data-mask' ? createObject('data-mask') : setTool(next)}
          masks={masks}
          activeMaskId={project.activeMaskId}
          onMaskSelect={(id) => {
            commit((current) => ({ ...current, activeMaskId: id, workingSet: { ...current.workingSet, activeDataMaskId: id } }));
            setSelectedId(id);
          }}
          onAddMask={() => createObject('data-mask')}
          onDuplicateMask={() => createObject('data-mask')}
          onDeleteMask={() => deleteObject(project.activeMaskId)}
          softKeyMasks={softKeyMasks}
          activeSoftKeyMaskId={project.workingSet.activeSoftKeyMaskId}
          onSoftKeyMaskSelect={(id) => {
            commit((current) => ({ ...current, workingSet: { ...current.workingSet, activeSoftKeyMaskId: id } }));
            setSelectedId(id);
          }}
          onAddSoftKeyMask={() => createObject('soft-key-mask')}
          onDeleteSoftKeyMask={() => {
            const id = project.workingSet.activeSoftKeyMaskId;
            if (id) deleteObject(id);
          }}
          onCreateObject={(kind) => createObject(kind)}
          onCreateAttribute={createAttributeReference}
        />
        <EditorCanvas
          project={project}
          selectedId={selectedId}
          viewport={viewport}
          tool={tool}
          onSelect={setSelectedId}
          onViewportChange={setViewport}
          onToolChange={setTool}
          onCreateObject={createObject}
          onUpdateObject={patchObject}
        />
        <RightSidebar
          project={project}
          selectedId={selectedId}
          onSelect={setSelectedId}
          onPatchSelected={(changes) => patchObject(selectedId, changes)}
          onPatchWorkingSet={patchWorkingSet}
          onToggleVisible={(id) => patchObject(id, { visible: !project.objects.find((o) => o.id === id)?.visible })}
          onToggleWorkingSetVisible={() => commit((current) => ({ ...current, workingSet: { ...current.workingSet, visible: !current.workingSet.visible } }))}
          onDelete={deleteObject}
          onLayer={layer}
          onCreateAttributeReference={createAttributeReference}
        />
      </div>
      <div className={`validation-chip ${errors.length ? 'invalid' : ''}`}>
        {errors.length ? `${errors.length} validation issue(s)` : 'Valid object pool draft'}
      </div>
      {exportErrors && (
        <ExportErrorsDialog errors={exportErrors} onClose={() => setExportErrors(null)} />
      )}
    </div>
  );
}
