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
  'container', 'output-string', 'output-number', 'output-line', 'output-polygon', 'output-ellipse', 'output-rectangle', 'button', 'input-boolean', 'input-string', 'input-number', 'input-list', 'picture-graphic',
]);

export function App() {
  const { project, setProject, commit, undo, redo, canUndo, canRedo } = useProjectState();
  const initialSelectedId = project.activeMaskId || project.workingSet.id;
  const [selectedId, setSelectedId] = useState(initialSelectedId);
  const [selectedIds, setSelectedIds] = useState<string[]>([initialSelectedId]);
  const [tool, setTool] = useState<ToolMode>('select');
  const [viewport, setViewport] = useState<Viewport>({ x: 200, y: 100, zoom: 0.85 });
  const [exportErrors, setExportErrors] = useState<string[] | null>(null);
  const [sidebarsVisible, setSidebarsVisible] = useState(true);
  const errors = validate(project);

  const masks        = project.objects.filter((o) => o.kind === 'data-mask');
  const alarmMasks   = project.objects.filter((o) => o.kind === 'alarm-mask');
  const softKeyMasks = project.objects.filter((o) => o.kind === 'soft-key-mask');

  function selectSingle(id: string) {
    setSelectedId(id);
    setSelectedIds([id]);
  }

  function selectFromCanvas(id: string, additive = false) {
    if (!additive) return selectSingle(id);

    setSelectedIds((current) => {
      if (current.includes(id)) {
        const next = current.filter((selected) => selected !== id);
        const fallback = project.activeMaskId || project.workingSet.id;
        setSelectedId(next[0] ?? fallback);
        return next.length ? next : [fallback];
      }
      setSelectedId(id);
      return [...current, id];
    });
  }

  useEffect(() => {
    const selectedExists = selectedId === project.workingSet.id || project.objects.some((object) => object.id === selectedId);
    if (!selectedExists) {
      const fallback = project.activeMaskId || project.workingSet.id;
      setSelectedId(fallback);
      setSelectedIds([fallback]);
    }
    else setSelectedIds((current) => current.filter((id) => id === project.workingSet.id || project.objects.some((object) => object.id === id)));
  }, [project, selectedId]);

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
      if (!(event.metaKey || event.ctrlKey)) return;
      const key = event.key.toLowerCase();
      if (key === 'z') {
        event.preventDefault();
        if (event.shiftKey) redo(); else undo();
      } else if (key === 'y') {
        event.preventDefault();
        redo();
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

  function patchObjects(updates: { id: string; changes: Partial<EditorObject> }[]) {
    if (!updates.length) return;
    commit((current) => {
      const updateById = new Map(updates.map((update) => [update.id, update.changes]));
      return {
        ...current,
        objects: current.objects.map((object) => {
          const changes = updateById.get(object.id);
          return changes ? { ...object, ...changes } : object;
        }),
      };
    });
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
    if (changes.activeDataMaskId) selectSingle(changes.activeDataMaskId);
  }

  // ── Object creation ───────────────────────────────────────────────────
  function createObject(kind: ObjectKind, x = 70, y = 70, parentId = project.activeMaskId, overrides?: Partial<EditorObject>) {
    commit((current) => {
      const isMask      = kind === 'data-mask';
      const isAlarmMask = kind === 'alarm-mask';
      const isSKM       = kind === 'soft-key-mask';
      const isKey       = kind === 'key';
      const isCanvas    = CANVAS_KINDS.has(kind);

      // Which Data Mask, Alarm Mask, or Button to append this canvas child to.
      const targetParentId = isCanvas ? parentId : current.activeMaskId;
      const activeSKMId  = current.workingSet.activeSoftKeyMaskId;
      const base        = createEditorObject(kind, current, x, y, targetParentId);
      const next        = overrides ? { ...base, ...overrides } : base;

      selectSingle(next.id);

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
    if (kind === 'font-attribute') return object.kind === 'output-string' || object.kind === 'output-number' || object.kind === 'input-boolean' || object.kind === 'input-string' || object.kind === 'input-number';
    if (kind === 'string-variable') return object.kind === 'output-string' || object.kind === 'input-string';
    if (kind === 'number-variable') return object.kind === 'output-number' || object.kind === 'input-boolean' || object.kind === 'input-number' || object.kind === 'input-list';
    if (kind === 'line-attribute' || kind === 'fill-attribute') return object.kind === 'output-rectangle' || object.kind === 'output-polygon' || object.kind === 'output-ellipse';
    return false;
  }

  // ── Deletion ──────────────────────────────────────────────────────────
  function deleteObject(id: string) {
    const object = project.objects.find((o) => o.id === id);
    if (!object) return;
    // Prevent deleting the last data mask or alarm mask
    if (object.kind === 'data-mask' && project.objects.filter((o) => o.kind === 'data-mask').length === 1) return;
    if (object.kind === 'alarm-mask' && project.objects.filter((o) => o.kind === 'alarm-mask').length === 1) return;

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

      selectSingle(activeMaskId || current.workingSet.id);
      return { ...current, activeMaskId, workingSet: { ...current.workingSet, activeDataMaskId: activeMaskId }, objects };
    });
  }

  function cloneObject(id: string) {
    const source = project.objects.find((object) => object.id === id);
    if (!source) return;

    commit((current) => {
      const sourceInCurrent = current.objects.find((object) => object.id === id);
      if (!sourceInCurrent) return current;

      const base = createEditorObject(sourceInCurrent.kind, current, sourceInCurrent.x + 10, sourceInCurrent.y + 10, sourceInCurrent.parentId ?? current.activeMaskId);
      const clone: EditorObject = {
        ...sourceInCurrent,
        id: base.id,
        objectId: base.objectId,
        name: `${sourceInCurrent.name} Copy`,
        x: sourceInCurrent.x + (sourceInCurrent.kind === 'data-mask' || sourceInCurrent.kind === 'soft-key-mask' ? 0 : 10),
        y: sourceInCurrent.y + (sourceInCurrent.kind === 'data-mask' || sourceInCurrent.kind === 'soft-key-mask' ? 0 : 10),
        zIndex: current.objects.length + 1,
        childObjectIds: sourceInCurrent.childObjectIds ? [] : undefined,
        keys: sourceInCurrent.keys ? [] : undefined,
      };

      selectSingle(clone.id);

      return {
        ...current,
        nextNumber: current.nextNumber + 1,
        objects: [
          ...current.objects.map((object) => {
            if (sourceInCurrent.parentId && object.id === sourceInCurrent.parentId) {
              return { ...object, childObjectIds: [...(object.childObjectIds ?? []), clone.id] };
            }
            if (sourceInCurrent.kind === 'key' && object.kind === 'soft-key-mask' && (object.keys ?? []).includes(sourceInCurrent.id)) {
              const keys = object.keys ?? [];
              const sourceIndex = keys.indexOf(sourceInCurrent.id);
              return { ...object, keys: [...keys.slice(0, sourceIndex + 1), clone.id, ...keys.slice(sourceIndex + 1)] };
            }
            return object;
          }),
          clone,
        ],
      };
    });
  }

  // ── Layering ──────────────────────────────────────────────────────────
  function getLayerSiblings(current: typeof project, selected: EditorObject) {
    if (selected.kind === 'data-mask') return current.objects.filter((object) => object.kind === 'data-mask');

    const parent = selected.parentId
      ? current.objects.find((object) => object.id === selected.parentId)
      : current.objects.find((object) => object.id === current.activeMaskId);
    const siblingIds = parent?.childObjectIds ?? [];
    return current.objects.filter((object) => siblingIds.includes(object.id));
  }

  function moveLayerById(id: string, direction: 'up' | 'down') {
    commit((current) => {
      const selected = current.objects.find((object) => object.id === id);
      if (!selected) return current;
      const siblings = getLayerSiblings(current, selected).sort((a, b) => a.zIndex - b.zIndex);
      const index = siblings.findIndex((object) => object.id === id);
      const swapWith = direction === 'up' ? siblings[index + 1] : siblings[index - 1];
      if (!swapWith) return current;

      return {
        ...current,
        objects: current.objects.map((object) => {
          if (object.id === selected.id) return { ...object, zIndex: swapWith.zIndex };
          if (object.id === swapWith.id) return { ...object, zIndex: selected.zIndex };
          return object;
        }),
      };
    });
  }

  function layer(action: 'front' | 'back' | 'forward' | 'backward') {
    if (action === 'forward' || action === 'backward') {
      moveLayerById(selectedId, action === 'forward' ? 'up' : 'down');
      return;
    }

    const selected = project.objects.find((o) => o.id === selectedId);
    if (!selected) return;
    const siblings = getLayerSiblings(project, selected);
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
        onUndo={undo}
        onRedo={redo}
        canUndo={canUndo}
        canRedo={canRedo}
        vtVersion={project.workingSet.vtVersion ?? 3}
        onVtVersionChange={(v) => commit((current) => ({ ...current, workingSet: { ...current.workingSet, vtVersion: v } }))}
      />
      <div className={`workspace ${sidebarsVisible ? '' : 'sidebars-hidden'}`}>
        <LeftSidebar
          tool={tool}
          onToolChange={(next) => next === 'data-mask' ? createObject('data-mask') : setTool(next)}
          masks={masks}
          activeMaskId={project.activeMaskId}
          onMaskSelect={(id) => {
            commit((current) => ({ ...current, activeMaskId: id, workingSet: { ...current.workingSet, activeDataMaskId: id } }));
            selectSingle(id);
          }}
          onAddMask={() => createObject('data-mask')}
          onDuplicateMask={() => createObject('data-mask')}
          onDeleteMask={() => deleteObject(project.activeMaskId)}
          softKeyMasks={softKeyMasks}
          activeSoftKeyMaskId={project.workingSet.activeSoftKeyMaskId}
          onSoftKeyMaskSelect={(id) => {
            commit((current) => ({ ...current, workingSet: { ...current.workingSet, activeSoftKeyMaskId: id } }));
            selectSingle(id);
          }}
          onAddSoftKeyMask={() => createObject('soft-key-mask')}
          onDeleteSoftKeyMask={() => {
            const id = project.workingSet.activeSoftKeyMaskId;
            if (id) deleteObject(id);
          }}
          alarmMasks={alarmMasks}
          onAlarmMaskSelect={(id) => selectSingle(id)}
          onAddAlarmMask={() => createObject('alarm-mask')}
          onDeleteAlarmMask={() => deleteObject(selectedId)}
          onCreateObject={(kind) => createObject(kind)}
          onCreateAttribute={createAttributeReference}
        />
        <EditorCanvas
          project={project}
          selectedId={selectedId}
          selectedIds={selectedIds}
          viewport={viewport}
          tool={tool}
          onSelect={selectFromCanvas}
          onViewportChange={setViewport}
          onToolChange={setTool}
          onCreateObject={createObject}
          onUpdateObject={patchObject}
          onUpdateObjects={patchObjects}
        />
        <RightSidebar
          project={project}
          validationErrors={errors}
          selectedId={selectedId}
          onSelect={selectSingle}
          onPatchSelected={(changes) => patchObject(selectedId, changes)}
          onPatchWorkingSet={patchWorkingSet}
          onToggleVisible={(id) => patchObject(id, { visible: !project.objects.find((o) => o.id === id)?.visible })}
          onToggleWorkingSetVisible={() => commit((current) => ({ ...current, workingSet: { ...current.workingSet, visible: !current.workingSet.visible } }))}
          onDelete={deleteObject}
          onClone={cloneObject}
          onLayer={layer}
          onMoveLayer={moveLayerById}
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
