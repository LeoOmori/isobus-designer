import type { PointerEvent, WheelEvent } from 'react';
import { useCallback, useRef, useState } from 'react';
import { clamp, fillTypeToBackground, fontCellScaleX, horizontalAlignToFlex, lineArtToCss, snap, textTransformOrigin, verticalAlignToFlex, vtColor } from '../domain/isobus';
import { getActiveMask, getCanvasChildren } from '../domain/selectors';
import type { DragState, EditorObject, ObjectKind, ProjectState, ToolMode, Viewport } from '../domain/types';
import { BottomControls, CanvasToolbar } from './CanvasToolbar';

export function EditorCanvas({ project, selectedId, viewport, tool, onSelect, onViewportChange, onToolChange, onCreateObject, onUpdateObject }: {
  project: ProjectState;
  selectedId: string;
  viewport: Viewport;
  tool: ToolMode;
  onSelect: (id: string) => void;
  onViewportChange: (viewport: Viewport) => void;
  onToolChange: (tool: ToolMode) => void;
  onCreateObject: (kind: ObjectKind, x: number, y: number, parentMaskId?: string) => void;
  onUpdateObject: (id: string, changes: Partial<EditorObject>) => void;
}) {
  const stageRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef<DragState | null>(null);
  const [editingTextObjectId, setEditingTextObjectId] = useState<string | null>(null);
  const activeMask = getActiveMask(project);
  const masks = project.objects.filter((object) => object.kind === 'data-mask' && object.visible);
  const lineAttributes = project.objects.filter((object) => object.kind === 'line-attribute');
  const fillAttributes = project.objects.filter((object) => object.kind === 'fill-attribute');
  const fontAttributes = project.objects.filter((object) => object.kind === 'font-attribute');
  const stringVariables = project.objects.filter((object) => object.kind === 'string-variable');

  const screenToWorld = useCallback((clientX: number, clientY: number) => {
    const rect = stageRef.current!.getBoundingClientRect();
    return { x: (clientX - rect.left - viewport.x) / viewport.zoom, y: (clientY - rect.top - viewport.y) / viewport.zoom };
  }, [viewport]);

  const screenToMask = useCallback((clientX: number, clientY: number, mask = activeMask) => {
    const world = screenToWorld(clientX, clientY);
    return { x: world.x - mask.x, y: world.y - mask.y };
  }, [activeMask, screenToWorld]);

  function findMaskAt(clientX: number, clientY: number) {
    const world = screenToWorld(clientX, clientY);
    return [...masks]
      .sort((a, b) => b.zIndex - a.zIndex)
      .find((mask) => world.x >= mask.x && world.x <= mask.x + mask.width && world.y >= mask.y && world.y <= mask.y + mask.height) ?? activeMask;
  }

  function handleWheel(event: WheelEvent<HTMLDivElement>) {
    event.preventDefault();
    const rect = stageRef.current!.getBoundingClientRect();
    const before = screenToWorld(event.clientX, event.clientY);
    const nextZoom = clamp(viewport.zoom - event.deltaY * 0.001, 0.25, 3);
    onViewportChange({ x: event.clientX - rect.left - before.x * nextZoom, y: event.clientY - rect.top - before.y * nextZoom, zoom: nextZoom });
  }

  function handleStagePointerDown(event: PointerEvent<HTMLDivElement>) {
    setEditingTextObjectId(null);
    const isPan = tool === 'pan' || event.button === 1 || event.metaKey || event.altKey;
    if (isPan) {
      dragRef.current = { type: 'pan', startX: event.clientX, startY: event.clientY, startView: viewport };
      event.currentTarget.setPointerCapture(event.pointerId);
      return;
    }

    if (tool === 'rectangle' || tool === 'output-string') {
      const targetMask = findMaskAt(event.clientX, event.clientY);
      const point = screenToMask(event.clientX, event.clientY, targetMask);
      onSelect(targetMask.id);
      onCreateObject(tool, snap(point.x), snap(point.y), targetMask.id);
      onToolChange('select');
      return;
    }

    onSelect(activeMask.id);
  }

  function handlePointerMove(event: PointerEvent<HTMLDivElement>) {
    const drag = dragRef.current;
    if (!drag) return;
    if (drag.type === 'pan') {
      onViewportChange({ ...viewport, x: drag.startView.x + event.clientX - drag.startX, y: drag.startView.y + event.clientY - drag.startY });
      return;
    }
    const dx = (event.clientX - drag.startX) / viewport.zoom;
    const dy = (event.clientY - drag.startY) / viewport.zoom;
    if (drag.startObject.locked) return;
    if (drag.type === 'move') onUpdateObject(drag.objectId, { x: snap(drag.startObject.x + dx), y: snap(drag.startObject.y + dy) });
    else onUpdateObject(drag.objectId, { width: Math.max(20, snap(drag.startObject.width + dx)), height: Math.max(16, snap(drag.startObject.height + dy)) });
  }

  function beginMove(event: PointerEvent<HTMLElement>, object: EditorObject) {
    event.stopPropagation();
    onSelect(object.id);
    if (editingTextObjectId === object.id || object.locked) return;
    dragRef.current = { type: 'move', objectId: object.id, startX: event.clientX, startY: event.clientY, startObject: object };
    stageRef.current?.setPointerCapture(event.pointerId);
  }

  function beginResize(event: PointerEvent<HTMLSpanElement>, object: EditorObject) {
    event.stopPropagation();
    onSelect(object.id);
    if (object.locked) return;
    dragRef.current = { type: 'resize', objectId: object.id, startX: event.clientX, startY: event.clientY, startObject: object };
    stageRef.current?.setPointerCapture(event.pointerId);
  }

  return (
    <main ref={stageRef} className={`stage tool-${tool}`} onWheel={handleWheel} onPointerDown={handleStagePointerDown} onPointerMove={handlePointerMove} onPointerUp={() => { dragRef.current = null; }}>
      <CanvasToolbar tool={tool} onToolChange={onToolChange} />
      <div className="world" style={{ transform: `translate(${viewport.x}px, ${viewport.y}px) scale(${viewport.zoom})` }}>
        {project.workingSet.visible && masks.map((mask) => {
          const children = getCanvasChildren(project, mask.id);
          return (
          <div key={mask.id} className={`vt-card interactive ${selectedId === mask.id ? 'selected-object' : ''}`} style={{ left: mask.x, top: mask.y, width: mask.width, height: mask.height, background: mask.backgroundColor, opacity: mask.visible ? 1 : 0, pointerEvents: mask.visible ? 'auto' : 'none', zIndex: mask.zIndex }} onPointerDown={(event) => { event.stopPropagation(); onSelect(mask.id); if (tool === 'rectangle' || tool === 'output-string') { const point = screenToMask(event.clientX, event.clientY, mask); onCreateObject(tool, snap(point.x), snap(point.y), mask.id); onToolChange('select'); return; } if (tool !== 'select' || mask.locked) return; dragRef.current = { type: 'move', objectId: mask.id, startX: event.clientX, startY: event.clientY, startObject: mask }; stageRef.current?.setPointerCapture(event.pointerId); }}>
            <div className="mask-label">{mask.id}</div>
            {children.map((object) => {
              const line = lineAttributes.find((attribute) => attribute.id === object.lineAttributeId);
              const fill = fillAttributes.find((attribute) => attribute.id === object.fillAttributeId);
              const font = fontAttributes.find((attribute) => attribute.id === object.fontAttributeId);
              const variable = stringVariables.find((item) => item.id === object.stringVariableId);
              const borderColor = object.kind === 'rectangle' ? vtColor(line?.lineColor ?? 0) : object.borderColor;
              const borderWidth = object.kind === 'rectangle' ? line?.lineWidth ?? 1 : 1;
              const background = object.kind === 'rectangle' ? fillTypeToBackground(fill?.fillType ?? 'solid', vtColor(fill?.fillColor ?? 15)) : object.backgroundColor;
              const fontWeight = (font?.fontStyle ?? 0) & 1 ? 700 : undefined;
              const fontStyle = (font?.fontStyle ?? 0) & 2 ? 'italic' : undefined;
              const textDecoration = (font?.fontStyle ?? 0) & 4 ? 'underline' : undefined;
              const displayText = variable?.stringValue ?? object.text ?? '';
              const isEditingText = editingTextObjectId === object.id;
              const textScaleX = object.kind === 'output-string' ? fontCellScaleX(font) : 1;
              return (
                <div key={object.id} className={`canvas-object object-${object.kind} ${selectedId === object.id ? 'selected-object' : ''}`} style={{ left: object.x, top: object.y, width: object.width, height: object.height, background, borderColor, borderWidth, borderStyle: object.kind === 'rectangle' ? lineArtToCss(line?.lineArt) : 'solid', zIndex: 20 + object.zIndex, fontSize: object.kind === 'output-string' ? font?.fontHeight ?? font?.fontSize ?? object.fontSize : object.fontSize, fontFamily: object.kind === 'output-string' && font?.proportional === false ? 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace' : undefined, color: object.kind === 'output-string' ? vtColor(font?.fontColor ?? 0) : undefined, fontWeight, fontStyle, textDecoration, justifyContent: object.kind === 'output-string' ? horizontalAlignToFlex(object.horizontalAlign) : undefined, alignItems: object.kind === 'output-string' ? verticalAlignToFlex(object.verticalAlign) : undefined }} onPointerDown={(event) => beginMove(event, object)} onDoubleClick={(event) => { if (object.kind !== 'output-string') return; event.stopPropagation(); onSelect(object.id); setEditingTextObjectId(object.id); }}>
                  {object.kind === 'output-string' && (isEditingText ? <input className="inline-text-input" autoFocus value={displayText} style={{ transform: `scaleX(${textScaleX})`, transformOrigin: textTransformOrigin(object.horizontalAlign) }} onPointerDown={(event) => event.stopPropagation()} onDoubleClick={(event) => event.stopPropagation()} onChange={(event) => onUpdateObject(variable?.id ?? object.id, variable ? { stringValue: event.target.value } : { text: event.target.value })} onKeyDown={(event) => { if (event.key === 'Enter' || event.key === 'Escape') { event.preventDefault(); setEditingTextObjectId(null); } }} onBlur={() => setEditingTextObjectId(null)} /> : <span className="inline-text-editor" style={{ transform: `scaleX(${textScaleX})`, transformOrigin: textTransformOrigin(object.horizontalAlign) }}>{displayText}</span>)}
                  {selectedId === object.id && <span className="resize-handle" onPointerDown={(event) => beginResize(event, object)} />}
                </div>
              );
            })}
          </div>
        );})}
      </div>
      <BottomControls zoom={viewport.zoom} onZoom={(zoom) => onViewportChange({ ...viewport, zoom: clamp(zoom, 0.25, 3) })} />
    </main>
  );
}
