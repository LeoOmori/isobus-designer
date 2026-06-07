import type { EditorObject, ProjectState, ReferenceKind, WorkingSet } from '../domain/types';
import { PropertiesPanel, WorkingSetProperties } from '../properties/PropertiesPanel';
import { ObjectTree } from './ObjectTree';
import { ResizableSplit } from '../ui/primitives';

export function RightSidebar({
  project, selectedId,
  onSelect, onPatchSelected, onPatchWorkingSet,
  onToggleVisible, onToggleWorkingSetVisible,
  onDelete, onLayer, onCreateAttributeReference,
}: {
  project: ProjectState;
  selectedId: string;
  onSelect: (id: string) => void;
  onPatchSelected: (changes: Partial<EditorObject>) => void;
  onPatchWorkingSet: (changes: Partial<WorkingSet>) => void;
  onToggleVisible: (id: string) => void;
  onToggleWorkingSetVisible: () => void;
  onDelete: (id: string) => void;
  onLayer: (action: 'front' | 'back' | 'forward' | 'backward') => void;
  onCreateAttributeReference: (kind: ReferenceKind) => void;
}) {
  const selectedObject  = project.objects.find((o) => o.id === selectedId) ?? project.objects[0];
  const masks           = project.objects.filter((o) => o.kind === 'data-mask');
  const softKeyMasks    = project.objects.filter((o) => o.kind === 'soft-key-mask');

  return (
    <aside className="right-sidebar">
      <ResizableSplit defaultTopHeight={280} minTopHeight={100} minBottomHeight={100}>
        <ObjectTree
          project={project}
          selectedId={selectedId}
          onSelect={onSelect}
          onToggleVisible={onToggleVisible}
          onToggleWorkingSetVisible={onToggleWorkingSetVisible}
          onDelete={onDelete}
        />
        {selectedId === project.workingSet.id || !selectedObject
          ? (
            <WorkingSetProperties
              workingSet={project.workingSet}
              masks={masks}
              objects={project.objects}
              onPatch={onPatchWorkingSet}
            />
          ) : (
            <PropertiesPanel
              selectedObject={selectedObject}
              masks={masks}
              softKeyMasks={softKeyMasks}
              objects={project.objects}
              onPatch={onPatchSelected}
              onDelete={() => onDelete(selectedObject.id)}
              onLayer={onLayer}
              onCreateAttributeReference={onCreateAttributeReference}
            />
          )}
      </ResizableSplit>
    </aside>
  );
}
