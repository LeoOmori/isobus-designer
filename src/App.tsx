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

export function App() {
  const { project, setProject, commit, undo, redo, canUndo, canRedo } = useProjectState();
  const [selectedId, setSelectedId] = useState(project.activeMaskId);
  const [tool, setTool] = useState<ToolMode>('select');
  const [viewport, setViewport] = useState<Viewport>({ x: 330, y: 175, zoom: 0.72 });
  const errors = validate(project);
  const masks = project.objects.filter((object) => object.kind === 'data-mask');

  useEffect(() => {
    const id = window.setInterval(() => window.localStorage.setItem(storageKey, JSON.stringify(project)), 30000);
    return () => window.clearInterval(id);
  }, [project]);

  useEffect(() => {
    const handler = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'z') {
        event.preventDefault();
        if (event.shiftKey) redo(); else undo();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [redo, undo]);

  function patchObject(id: string, changes: Partial<EditorObject>) {
    commit((current) => ({ ...current, objects: current.objects.map((object) => object.id === id ? { ...object, ...changes } : object) }));
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

  function createObject(kind: ObjectKind, x = 70, y = 70, parentMaskId = project.activeMaskId) {
    commit((current) => {
      const next = createEditorObject(kind, current, x, y, parentMaskId);
      const isMask = kind === 'data-mask';
      const isCanvasObject = kind === 'output-string' || kind === 'rectangle';
      setSelectedId(next.id);
      return {
        ...current,
        activeMaskId: isMask ? next.id : current.activeMaskId,
        workingSet: isMask ? { ...current.workingSet, activeDataMaskId: next.id } : current.workingSet,
        nextNumber: current.nextNumber + 1,
        objects: [
          ...current.objects.map((object) => object.id === parentMaskId && isCanvasObject
            ? { ...object, childObjectIds: [...(object.childObjectIds ?? []), next.id] }
            : object,
          ),
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
        objects: current.objects.map((object) => object.id === selectedId && (object.kind === 'rectangle' || object.kind === 'output-string')
          ? { ...object, ...referencePatch(kind, attribute.id) }
          : object,
        ).concat(attribute),
      };
    });
  }

  function deleteObject(id: string) {
    const object = project.objects.find((item) => item.id === id);
    if (!object || (object.kind === 'data-mask' && project.objects.filter((item) => item.kind === 'data-mask').length === 1)) return;
    commit((current) => {
      const deleteIds = new Set([id]);
      const objects = current.objects
        .filter((item) => !deleteIds.has(item.id))
        .map((item) => item.kind === 'data-mask' ? { ...item, childObjectIds: item.childObjectIds?.filter((childId) => childId !== id && !deleteIds.has(childId)) } : item);
      const activeMaskId = deleteIds.has(current.activeMaskId) ? objects.find((item) => item.kind === 'data-mask')!.id : current.activeMaskId;
      setSelectedId(activeMaskId);
      return { ...current, activeMaskId, workingSet: { ...current.workingSet, activeDataMaskId: activeMaskId }, objects };
    });
  }

  function layer(action: 'front' | 'back' | 'forward' | 'backward') {
    const selected = project.objects.find((object) => object.id === selectedId);
    if (!selected || selected.kind === 'data-mask') return;
    const activeMask = project.objects.find((object) => object.id === project.activeMaskId);
    const activeChildIds = new Set(activeMask?.childObjectIds ?? []);
    const siblings = project.objects.filter((object) => activeChildIds.has(object.id));
    const max = Math.max(...siblings.map((object) => object.zIndex));
    const min = Math.min(...siblings.map((object) => object.zIndex));
    const next = action === 'front' ? max + 1 : action === 'back' ? min - 1 : action === 'forward' ? selected.zIndex + 1 : selected.zIndex - 1;
    patchObject(selected.id, { zIndex: next });
  }

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
          onMaskSelect={(id) => { commit((current) => ({ ...current, activeMaskId: id, workingSet: { ...current.workingSet, activeDataMaskId: id } })); setSelectedId(id); }}
          onAddMask={() => createObject('data-mask')}
          onDuplicateMask={() => createObject('data-mask')}
          onDeleteMask={() => deleteObject(project.activeMaskId)}
          onCreateAttribute={createObject}
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
          onToggleVisible={(id) => patchObject(id, { visible: !project.objects.find((object) => object.id === id)?.visible })}
          onToggleWorkingSetVisible={() => commit((current) => ({ ...current, workingSet: { ...current.workingSet, visible: !current.workingSet.visible } }))}
          onDelete={deleteObject}
          onLayer={layer}
          onCreateAttributeReference={createAttributeReference}
        />
      </div>
      <div className={`validation-chip ${errors.length ? 'invalid' : ''}`}>{errors.length ? `${errors.length} validation issue(s)` : 'Valid object pool draft'}</div>
    </div>
  );
}
