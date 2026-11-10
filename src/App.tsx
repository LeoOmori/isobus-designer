import { useMemo, useState } from 'react';
import { EditorCanvas } from './canvas/EditorCanvas';
import { clamp } from './domain/isobus';
import type { ToolMode, Viewport } from './domain/types';
import { validate } from './domain/validation';
import { defaultIopFilename, downloadFile } from './domain/export/downloadIop';
import { exportObjectPool } from './domain/export/exportObjectPool';
import { exportXml } from './domain/export/xml/exportXml';
import { zipStore } from './domain/export/xml/zip';
import { initialProject } from './domain/initialProject';
import { parseProjectFile, serializeProject } from './domain/projectFile';
import { AboutDialog } from './panels/AboutDialog';
import { ExportErrorsDialog } from './panels/ExportErrorsDialog';
import { LeftSidebar } from './panels/LeftSidebar';
import { RightSidebar } from './panels/RightSidebar';
import { TopToolbar } from './panels/TopToolbar';
import { useKeyboardShortcuts } from './state/useKeyboardShortcuts';
import { useLayerCommands } from './state/useLayerCommands';
import { useObjectCommands } from './state/useObjectCommands';
import { usePersistence } from './state/usePersistence';
import { usePictureGraphicSync } from './state/usePictureGraphicSync';
import { useProjectState } from './state/useProjectState';
import { useSelection } from './state/useSelection';

export function App() {
  const { project, setProject, commit, undo, redo, canUndo, canRedo } = useProjectState();
  const { selectedId, selectedIds, selectSingle, selectFromCanvas } = useSelection(project);
  const {
    patchObject, patchObjects, patchWorkingSet,
    createObject, createAttributeReference,
    deleteObject, cloneObject,
  } = useObjectCommands({ commit, selectedId, selectSingle });
  const { layer, moveLayerById } = useLayerCommands({ commit, selectedId });

  const [tool, setTool] = useState<ToolMode>('select');
  const [viewport, setViewport] = useState<Viewport>({ x: 200, y: 100, zoom: 0.85 });
  const [exportErrors, setExportErrors] = useState<{ title?: string; errors: string[] } | null>(null);
  const [sidebarsVisible, setSidebarsVisible] = useState(true);
  const [aboutVisible, setAboutVisible] = useState(false);

  usePersistence(project);
  usePictureGraphicSync(project, setProject);
  useKeyboardShortcuts({ undo, redo });

  // ── Derived data (memoized to avoid per-render allocations) ────────────
  const errors = useMemo(() => validate(project), [project]);
  const masks = useMemo(
    () => project.objects.filter((o) => o.kind === 'data-mask'),
    [project.objects],
  );
  const alarmMasks = useMemo(
    () => project.objects.filter((o) => o.kind === 'alarm-mask'),
    [project.objects],
  );
  const softKeyMasks = useMemo(
    () => project.objects.filter((o) => o.kind === 'soft-key-mask'),
    [project.objects],
  );

  function handleExportIop() {
    const { bytes, errors: exportErrs } = exportObjectPool(project);
    if (exportErrs.length > 0) {
      setExportErrors({ errors: exportErrs });
      return;
    }
    downloadFile(bytes, defaultIopFilename(project));
  }

  function handleExportXml() {
    const { files, errors: exportErrs } = exportXml(project);
    if (exportErrs.length > 0) {
      setExportErrors({ errors: exportErrs });
      return;
    }
    downloadFile(zipStore(files), defaultIopFilename(project).replace(/\.iop$/, '-vt2iso.zip'));
  }

  function handleNewProject() {
    commit(() => initialProject); // undoable, like Open
  }

  function handleSaveProject() {
    downloadFile(new TextEncoder().encode(serializeProject(project)), defaultIopFilename(project).replace(/\.iop$/, '.json'));
  }

  async function handleOpenProject(file: File) {
    try {
      const opened = parseProjectFile(await file.text());
      commit(() => opened); // undoable, like any other edit
    } catch (error) {
      setExportErrors({ title: `Could not open ${file.name}`, errors: [(error as Error).message] });
    }
  }

  return (
    <div className="app-shell">
      <TopToolbar
        tool={tool}
        onToolChange={setTool}
        zoom={viewport.zoom}
        onZoom={(zoom) => setViewport({ ...viewport, zoom: clamp(zoom, 0.25, 3) })}
        fileActions={{
          onNewProject: handleNewProject,
          onOpenProject: handleOpenProject,
          onSaveProject: handleSaveProject,
          onExportIop: handleExportIop,
          onExportXml: handleExportXml,
        }}
        sidebarsVisible={sidebarsVisible}
        onToggleSidebars={() => setSidebarsVisible((v) => !v)}
        onUndo={undo}
        onRedo={redo}
        canUndo={canUndo}
        canRedo={canRedo}
        vtVersion={project.workingSet.vtVersion ?? 3}
        onVtVersionChange={(v) => commit((current) => ({ ...current, workingSet: { ...current.workingSet, vtVersion: v } }))}
        onAbout={() => setAboutVisible(true)}
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
        <ExportErrorsDialog title={exportErrors.title} errors={exportErrors.errors} onClose={() => setExportErrors(null)} />
      )}
      {aboutVisible && (
        <AboutDialog onClose={() => setAboutVisible(false)} />
      )}
    </div>
  );
}
