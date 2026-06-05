import { AlignCenter, Archive, ChevronDown, ChevronRight, Eye, EyeOff, Grid3X3, LayoutPanelLeft, MoreVertical, Trash2, Zap } from 'lucide-react';
import { useState } from 'react';
import { KindIcon } from '../domain/objectMeta';
import { getMaskChildren, getReferenceObjects } from '../domain/selectors';
import type { ProjectState } from '../domain/types';
import { Panel, SearchBox } from '../ui/primitives';

export function ObjectTree({ project, selectedId, onSelect, onToggleVisible, onToggleWorkingSetVisible, onDelete }: { project: ProjectState; selectedId: string; onSelect: (id: string) => void; onToggleVisible: (id: string) => void; onToggleWorkingSetVisible: () => void; onDelete: (id: string) => void }) {
  const masks = project.objects.filter((object) => object.kind === 'data-mask');
  const attributes = getReferenceObjects(project);
  const [expanded, setExpanded] = useState<Record<string, boolean>>({ WS_1: true });

  function isExpanded(id: string) {
    return expanded[id] ?? true;
  }

  function toggleExpanded(id: string) {
    setExpanded((current) => ({ ...current, [id]: !isExpanded(id) }));
  }

  return (
    <Panel title="Tree Object Menu">
      <div className="panel-toolbar"><SearchBox placeholder="Search objects..." /><Zap size={16} /></div>
      <div className="tree">
        <div className={`tree-row root ${selectedId === project.workingSet.id ? 'selected' : ''}`}>
          <button className="tree-chevron" onClick={() => toggleExpanded(project.workingSet.id)}>{isExpanded(project.workingSet.id) ? <ChevronDown size={14} /> : <ChevronRight size={14} />}</button>
          <button className="tree-select" onClick={() => onSelect(project.workingSet.id)}><Archive size={15} /><span>{project.workingSet.name} ({project.workingSet.id})</span></button>
          <button onClick={onToggleWorkingSetVisible}>{project.workingSet.visible ? <Eye size={14} /> : <EyeOff size={14} />}</button>
          <span />
        </div>
        {isExpanded(project.workingSet.id) && masks.map((mask) => (
          <div key={mask.id}>
            <div className={`tree-row mask ${selectedId === mask.id ? 'selected' : ''}`}>
              <button className="tree-chevron" onClick={() => toggleExpanded(mask.id)}>{isExpanded(mask.id) ? <ChevronDown size={14} /> : <ChevronRight size={14} />}</button>
              <button className="tree-select" onClick={() => onSelect(mask.id)}><LayoutPanelLeft size={15} /><span>Data Mask: {mask.id}</span></button>
              <button onClick={() => onToggleVisible(mask.id)}>{mask.visible ? <Eye size={14} /> : <EyeOff size={14} />}</button>
              <button onClick={() => onDelete(mask.id)}><MoreVertical size={14} /></button>
            </div>
            {isExpanded(mask.id) && getMaskChildren(project, mask.id).map((object) => (
              <div key={object.id} className={`tree-row child ${selectedId === object.id ? 'selected' : ''}`}>
                <button className="tree-select" onClick={() => onSelect(object.id)}><KindIcon kind={object.kind} /><span>{object.name}</span></button>
                <button onClick={() => onToggleVisible(object.id)}>{object.visible ? <Eye size={14} /> : <EyeOff size={14} />}</button>
                <button onClick={() => onDelete(object.id)}><Trash2 size={14} /></button>
              </div>
            ))}
          </div>
        ))}
        {isExpanded(project.workingSet.id) && attributes.length > 0 && (
          <div>
            <div className="tree-row root attributes-row">
              <button className="tree-chevron" onClick={() => toggleExpanded('ATTRIBUTES')}>{isExpanded('ATTRIBUTES') ? <ChevronDown size={14} /> : <ChevronRight size={14} />}</button>
              <button className="tree-select" onClick={() => toggleExpanded('ATTRIBUTES')}><Grid3X3 size={15} /><span>Attribute Objects</span></button>
              <span /><span />
            </div>
            {isExpanded('ATTRIBUTES') && attributes.map((object) => (
              <div key={object.id} className={`tree-row child ${selectedId === object.id ? 'selected' : ''}`}>
                <button className="tree-select" onClick={() => onSelect(object.id)}><KindIcon kind={object.kind} /><span>{object.name}</span></button>
                <span />
                <button onClick={() => onDelete(object.id)}><Trash2 size={14} /></button>
              </div>
            ))}
          </div>
        )}
        <div className="tree-row root second"><ChevronRight size={14} /><AlignCenter size={15} /><span>Soft Key Mask: SKM_1</span></div>
      </div>
    </Panel>
  );
}
