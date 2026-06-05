import { useEffect, useState } from 'react';
import { EditorCanvas } from './canvas/EditorCanvas';
import { clamp } from './domain/isobus';
import { initialProject } from './domain/initialProject';
import { createEditorObject, referencePatch } from './domain/objectFactory';
import type { EditorObject, ObjectKind, ReferenceKind, ToolMode, Viewport, WorkingSet } from './domain/types';
import { validate } from './domain/validation';
import { LeftSidebar } from './panels/LeftSidebar';
import { RightSidebar } from './panels/RightSidebar';
import { TopToolbar } from './panels/TopToolbar';
import { storageKey, useProjectState } from './state/useProjectState';

/** Kinds that are placed as children of a Data Mask on the canvas. */
const CANVAS_KINDS = new Set<ObjectKind>([
  'output-string', 'output-number', 'output-rectangle', 'button', 'picture-graphic',
]);

export function App() {
  const { project, setProject, commit, undo, redo, canUndo, canRedo } = useProjectState();
  const [selectedId, setSelectedId] = useState(project.activeMaskId);
  const [tool, setTool] = useState<ToolMode>('select');
  const [viewport, setViewport] = useState<Viewport>({ x: 200, y: 100, zoom: 0.85 });
  const errors = validate(project);

  const masks       = project.objects.filter((o) => o.kind === 'data-mask');
  const softKeyMasks = project.objects.filter((o) => o.kind === 'soft-key-mask');

  // ── Persistence ───────────────────────────────────────────────────────
  useEffect(() => {
    const id = window.setInterval(() => window.localStorage.setItem(storageKey, JSON.stringify(project)), 30_000);
    return () => window.clearInterval(id);
  }, [project]);

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
  function createObject(kind: ObjectKind, x = 70, y = 70, parentMaskId = project.activeMaskId) {
    commit((current) => {
      const next        = createEditorObject(kind, current, x, y, parentMaskId);
      const isMask      = kind === 'data-mask';
      const isSKM       = kind === 'soft-key-mask';
      const isKey       = kind === 'key';
      const isCanvas    = CANVAS_KINDS.has(kind);

      // Which parent mask/SKM to append this child to
      const targetMaskId = isCanvas ? parentMaskId : current.activeMaskId;
      const activeSKMId  = current.workingSet.activeSoftKeyMaskId;

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
            // Add canvas child to data mask childObjectIds
            if (isCanvas && o.id === targetMaskId) {
              return { ...o, childObjectIds: [...(o.childObjectIds ?? []), next.id] };
            }
            // Add key to soft key mask keys array
            if (isKey && o.id === activeSKMId) {
              return { ...o, keys: [...(o.keys ?? []), next.id] };
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
          o.id === selectedId && (CANVAS_KINDS.has(o.kind) || o.kind === 'button')
            ? { ...o, ...referencePatch(kind, attribute.id) }
            : o,
        ).concat(attribute),
      };
    });
  }

  // ── Deletion ──────────────────────────────────────────────────────────
  function deleteObject(id: string) {
    const object = project.objects.find((o) => o.id === id);
    if (!object) return;
    // Prevent deleting the last data mask
    if (object.kind === 'data-mask' && project.objects.filter((o) => o.kind === 'data-mask').length === 1) return;

    commit((current) => {
      const deleteIds = new Set([id]);
      const objects = current.objects
        .filter((o) => !deleteIds.has(o.id))
        .map((o) => {
          if (o.kind === 'data-mask') {
            return { ...o, childObjectIds: o.childObjectIds?.filter((c) => !deleteIds.has(c)) };
          }
          if (o.kind === 'soft-key-mask') {
            return { ...o, keys: o.keys?.filter((k) => !deleteIds.has(k)) };
          }
          return o;
        });

      const activeMaskId = deleteIds.has(current.activeMaskId)
        ? objects.find((o) => o.kind === 'data-mask')!.id
        : current.activeMaskId;

      setSelectedId(activeMaskId);
      return { ...current, activeMaskId, workingSet: { ...current.workingSet, activeDataMaskId: activeMaskId }, objects };
    });
  }

  // ── Layering ──────────────────────────────────────────────────────────
  function layer(action: 'front' | 'back' | 'forward' | 'backward') {
    const selected = project.objects.find((o) => o.id === selectedId);
    if (!selected || selected.kind === 'data-mask') return;
    const activeMask = project.objects.find((o) => o.id === project.activeMaskId);
    const activeChildIds = new Set(activeMask?.childObjectIds ?? []);
    const siblings = project.objects.filter((o) => activeChildIds.has(o.id));
    const max = Math.max(...siblings.map((o) => o.zIndex));
    const min = Math.min(...siblings.map((o) => o.zIndex));
    const next = action === 'front'    ? max + 1
               : action === 'back'     ? min - 1
               : action === 'forward'  ? selected.zIndex + 1
               : selected.zIndex - 1;
    patchObject(selected.id, { zIndex: next });
  }

  // ── Render ────────────────────────────────────────────────────────────
  return (
    <div className="app-shell">
      <TopToolbar
        zoom={viewport.zoom}
        onZoom={(zoom) => setViewport({ ...viewport, zoom: clamp(zoom, 0.25, 3) })}
        onReset={() => { setProject(initialProject); setSelectedId('DM_1'); }}
        onUndo={undo}
        onRedo={redo}
        canUndo={canUndo}
        canRedo={canRedo}
        onSave={() => window.localStorage.setItem(storageKey, JSON.stringify(project))}
        onExport={() => navigator.clipboard?.writeText(JSON.stringify(project, null, 2))}
      />
      <div className="workspace">
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
    </div>
  );
}
