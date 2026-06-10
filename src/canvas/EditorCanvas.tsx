import { Fragment, type PointerEvent, type WheelEvent, useCallback, useEffect, useRef, useState } from 'react';
import {
  BUTTON_FACE_INSET,
  BUTTON_OPTION_NO_BORDER,
  clamp,
  snap,
} from '../domain/isobus';
import { getActiveMask, getCanvasChildren, getSoftKeyMaskKeys } from '../domain/selectors';
import type { DragState, EditorObject, ObjectKind, ProjectState, ToolMode, Viewport } from '../domain/types';
import { derivedPictureGraphicHeight } from '../domain/vtPalette';
import { alarmMaskFrameStyle } from '../objects/alarm-mask';
import { dataMaskFrameStyle } from '../objects/data-mask';
import { buttonFrameStyle } from '../objects/button';
import { canvasObjectFrameStyle, isCanvasObjectRenderable, renderCanvasObjectContent, visibleChildObjects } from '../objects/canvasRenderRegistry';
import { SOFT_KEY_GAP, SOFT_KEY_SLOT_SIZE, SOFT_KEY_SLOTS, SOFT_KEY_ROWS, SOFT_KEY_WIDTH, softKeyMaskFrameStyle, softKeySlotStyle } from '../objects/soft-key-mask';

type BuildingPolygonState = {
  points: Array<{ x: number; y: number }>;
  maskId: string;
} | null;

/** Tools that create a canvas object on click. */
const CANVAS_TOOLS = new Set<ToolMode>([
  'container', 'output-rectangle', 'output-line', 'output-polygon', 'output-ellipse', 'output-string', 'button', 'input-boolean', 'input-string', 'input-number', 'input-list', 'output-number', 'output-meter', 'output-linear-bar-graph', 'output-arched-bar-graph', 'picture-graphic', 'object-pointer',
]);

const BUTTON_CHILD_TOOLS = new Set<ToolMode>([
  'output-rectangle', 'output-string', 'output-number', 'picture-graphic', 'object-pointer',
]);

const CONTAINER_CHILD_TOOLS = new Set<ToolMode>([
  'container', 'output-rectangle', 'output-line', 'output-polygon', 'output-ellipse', 'output-string', 'button', 'input-boolean', 'input-string', 'input-number', 'input-list', 'output-number', 'output-meter', 'output-linear-bar-graph', 'output-arched-bar-graph', 'picture-graphic', 'object-pointer',
]);

const KEY_CHILD_TOOLS = new Set<ToolMode>([
  'container', 'output-rectangle', 'output-string', 'output-number', 'picture-graphic', 'object-pointer',
]);

export function EditorCanvas({
  project, selectedId, selectedIds, viewport, tool,
  onSelect, onViewportChange, onToolChange, onCreateObject, onUpdateObject, onUpdateObjects,
}: {
  project: ProjectState;
  selectedId: string;
  selectedIds: string[];
  viewport: Viewport;
  tool: ToolMode;
  onSelect: (id: string, additive?: boolean) => void;
  onViewportChange: (viewport: Viewport) => void;
  onToolChange: (tool: ToolMode) => void;
  onCreateObject: (kind: ObjectKind, x: number, y: number, parentMaskId?: string, overrides?: Partial<EditorObject>) => void;
  onUpdateObject: (id: string, changes: Partial<EditorObject>) => void;
  onUpdateObjects: (updates: { id: string; changes: Partial<EditorObject> }[]) => void;
}) {
  const stageRef = useRef<HTMLDivElement>(null);
  const dragRef  = useRef<DragState | null>(null);
  const dragPreviewRef = useRef<Record<string, Partial<EditorObject>>>({});
  const lastObjectClickRef = useRef<{ id: string; time: number } | null>(null);
  const [editingTextObjectId, setEditingTextObjectId] = useState<string | null>(null);
  const [dragPreview, setDragPreview] = useState<Record<string, Partial<EditorObject>>>({});
  const [buildingPolygon, setBuildingPolygon] = useState<BuildingPolygonState>(null);
  const lastBuildClickRef = useRef<number>(0);

  const activeMask = getActiveMask(project);
  const masks      = project.objects.filter((o) => o.kind === 'data-mask' && o.visible);
  const alarmMasks = project.objects.filter((o) => o.kind === 'alarm-mask' && o.visible);

  const objectById = new Map(project.objects.map((object) => [object.id, object]));

  // ── Coordinate helpers ────────────────────────────────────────────────
  const screenToWorld = useCallback((clientX: number, clientY: number) => {
    const rect = stageRef.current!.getBoundingClientRect();
    return {
      x: (clientX - rect.left - viewport.x) / viewport.zoom,
      y: (clientY - rect.top  - viewport.y) / viewport.zoom,
    };
  }, [viewport]);

  const screenToMask = useCallback((clientX: number, clientY: number, mask: EditorObject) => {
    const world = screenToWorld(clientX, clientY);
    return { x: world.x - mask.x, y: world.y - mask.y };
  }, [screenToWorld]);

  /** Returns the topmost visible Data Mask under the pointer, or the active mask. */
  function findMaskAt(clientX: number, clientY: number): EditorObject | undefined {
    const world = screenToWorld(clientX, clientY);
    return [...masks]
      .sort((a, b) => b.zIndex - a.zIndex)
      .find((m) =>
        world.x >= m.x && world.x <= m.x + m.width &&
        world.y >= m.y && world.y <= m.y + m.height,
      ) ?? activeMask;
  }

  /** Shared canvas-tool create + reset helper. */
  function createOnMask(clientX: number, clientY: number, mask: EditorObject | undefined) {
    if (!mask) return;
    const point = screenToMask(clientX, clientY, mask);
    onSelect(mask.id);
    onCreateObject(tool as ObjectKind, snap(point.x), snap(point.y), mask.id);
    onToolChange('select');
  }

  // ── Polygon point-by-point building ──────────────────────────────────

  function handlePolygonClick(clientX: number, clientY: number, mask: EditorObject | undefined) {
    if (buildingPolygon) {
      // Double-click detection: finalize on rapid second click
      const now = Date.now();
      if (now - lastBuildClickRef.current <= 400) {
        finalizePolygon();
        return;
      }

      // Add a point relative to the building mask (always the original mask)
      const buildMask = objectById.get(buildingPolygon.maskId);
      if (!buildMask) { cancelPolygon(); return; }
      const point = screenToMask(clientX, clientY, buildMask);
      setBuildingPolygon({
        ...buildingPolygon,
        points: [...buildingPolygon.points, { x: snap(point.x), y: snap(point.y) }],
      });
      lastBuildClickRef.current = now;
    } else {
      // Start a new polygon build
      if (!mask) return;
      const point = screenToMask(clientX, clientY, mask);
      onSelect(mask.id);
      setBuildingPolygon({ maskId: mask.id, points: [{ x: snap(point.x), y: snap(point.y) }] });
      lastBuildClickRef.current = Date.now();
    }
  }

  function createPolygonFromPoints(points: Array<{ x: number; y: number }>, maskId: string) {
    const xs = points.map((p) => p.x);
    const ys = points.map((p) => p.y);
    const minX = Math.min(...xs);
    const minY = Math.min(...ys);
    const width = Math.max(1, Math.max(...xs) - minX);
    const height = Math.max(1, Math.max(...ys) - minY);
    const translatedPoints = points.map((p) => ({ x: p.x - minX, y: p.y - minY }));
    onCreateObject('output-polygon', minX, minY, maskId, { polygonPoints: translatedPoints, width, height });
  }

  function finalizePolygon() {
    if (!buildingPolygon) return;
    const { points, maskId } = buildingPolygon;
    setBuildingPolygon(null);
    if (points.length >= 3) {
      createPolygonFromPoints(points, maskId);
    }
    onToolChange('select');
  }

  function cancelPolygon() {
    setBuildingPolygon(null);
  }

  // Finalize/cancel on tool change away from output-polygon
  const prevToolRef = useRef(tool);
  useEffect(() => {
    const wasBuilding = buildingPolygon && prevToolRef.current === 'output-polygon';
    prevToolRef.current = tool;
    if (wasBuilding && tool !== 'output-polygon') {
      const { points, maskId } = buildingPolygon!;
      setBuildingPolygon(null);
      if (points.length >= 3) {
        createPolygonFromPoints(points, maskId);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tool]);

  // Keyboard shortcuts during polygon building (Enter = finalize, Escape = cancel)
  useEffect(() => {
    if (!buildingPolygon) return;
    function handler(event: KeyboardEvent) {
      if (event.key === 'Enter') { event.preventDefault(); finalizePolygon(); }
      if (event.key === 'Escape') { event.preventDefault(); cancelPolygon(); }
    }
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [buildingPolygon]);

  function buttonFaceInset(button: EditorObject) {
    return ((button.buttonOptions ?? 0) & BUTTON_OPTION_NO_BORDER) !== 0 ? 0 : BUTTON_FACE_INSET;
  }

  function objectWorldOrigin(object: EditorObject): { x: number; y: number } {
    const parent = object.parentId ? objectById.get(object.parentId) : undefined;
    if (!parent) return { x: object.x, y: object.y };

    const parentOrigin = objectWorldOrigin(parent);
    const parentFaceInset = parent.kind === 'button' ? buttonFaceInset(parent) : 0;
    return {
      x: parentOrigin.x + parentFaceInset + object.x,
      y: parentOrigin.y + parentFaceInset + object.y,
    };
  }

  function screenToButtonFace(clientX: number, clientY: number, button: EditorObject) {
    const world = screenToWorld(clientX, clientY);
    const buttonOrigin = objectWorldOrigin(button);
    const inset = buttonFaceInset(button);
    return { x: world.x - buttonOrigin.x - inset, y: world.y - buttonOrigin.y - inset };
  }

  function createOnButton(clientX: number, clientY: number, button: EditorObject) {
    const point = screenToButtonFace(clientX, clientY, button);
    onSelect(button.id);
    onCreateObject(tool as ObjectKind, snap(point.x), snap(point.y), button.id);
    onToolChange('select');
  }

  function screenToContainer(clientX: number, clientY: number, container: EditorObject) {
    const world = screenToWorld(clientX, clientY);
    const containerOrigin = objectWorldOrigin(container);
    return { x: world.x - containerOrigin.x, y: world.y - containerOrigin.y };
  }

  function createOnContainer(clientX: number, clientY: number, container: EditorObject) {
    const point = screenToContainer(clientX, clientY, container);
    onSelect(container.id);
    onCreateObject(tool as ObjectKind, snap(point.x), snap(point.y), container.id);
    onToolChange('select');
  }

  function createOnKeySlot(clientX: number, clientY: number, key: EditorObject, originX: number, originY: number) {
    const world = screenToWorld(clientX, clientY);
    const point = { x: world.x - originX, y: world.y - originY };
    onSelect(key.id);
    onCreateObject(tool as ObjectKind, snap(point.x), snap(point.y), key.id);
    onToolChange('select');
  }

  // ── Wheel ──────────────────────────────────────────────────────────────
  function handleWheel(event: WheelEvent<HTMLDivElement>) {
    event.preventDefault();
    const rect     = stageRef.current!.getBoundingClientRect();
    const before   = screenToWorld(event.clientX, event.clientY);
    const nextZoom = clamp(viewport.zoom - event.deltaY * 0.001, 0.25, 3);
    onViewportChange({
      x: event.clientX - rect.left - before.x * nextZoom,
      y: event.clientY - rect.top  - before.y * nextZoom,
      zoom: nextZoom,
    });
  }

  // ── Stage background pointer down ─────────────────────────────────────
  function handleStagePointerDown(event: PointerEvent<HTMLDivElement>) {
    setEditingTextObjectId(null);
    const isPan = tool === 'pan' || event.button === 1 || event.metaKey || event.altKey;
    if (isPan) {
      dragRef.current = { type: 'pan', startX: event.clientX, startY: event.clientY, startView: viewport };
      event.currentTarget.setPointerCapture(event.pointerId);
      return;
    }
    // Polygon tool uses a multi-click point-by-point workflow.
    if (tool === 'output-polygon') {
      handlePolygonClick(event.clientX, event.clientY, findMaskAt(event.clientX, event.clientY));
      return;
    }
    // When a creation tool is active, clicking the stage background creates on nearest/active mask.
    if (CANVAS_TOOLS.has(tool)) {
      createOnMask(event.clientX, event.clientY, findMaskAt(event.clientX, event.clientY));
      return;
    }
    if (activeMask) onSelect(activeMask.id);
  }

  // ── Mask background pointer down ──────────────────────────────────────
  function handleMaskPointerDown(event: PointerEvent<HTMLDivElement>, mask: EditorObject) {
    event.stopPropagation();
    if (tool === 'output-polygon') {
      handlePolygonClick(event.clientX, event.clientY, mask);
      return;
    }
    if (CANVAS_TOOLS.has(tool)) {
      createOnMask(event.clientX, event.clientY, mask);
      return;
    }
    const additiveSelection = event.shiftKey || event.metaKey || event.ctrlKey;
    const wasSelected = selectedIds.includes(mask.id);
    onSelect(mask.id, additiveSelection);
    if (additiveSelection) return;
    if (tool !== 'select' || mask.locked) return;
    dragRef.current = { type: 'move', objectId: mask.id, startX: event.clientX, startY: event.clientY, startObject: mask, startObjects: wasSelected ? selectedMovableObjects(mask) : [mask] };
    stageRef.current?.setPointerCapture(event.pointerId);
  }

  // ── Pointer move ──────────────────────────────────────────────────────
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
    if (drag.type === 'move') {
      updateDragPreview(Object.fromEntries(
        (drag.startObjects ?? [drag.startObject]).map((object) => [object.id, { x: snap(object.x + dx), y: snap(object.y + dy) }]),
      ));
    } else {
      if (drag.startObject.kind === 'picture-graphic') {
        const width = Math.max(20, snap(drag.startObject.width + dx));
        updateDragPreview({ [drag.objectId]: {
          targetWidth: width,
          width,
          height: derivedPictureGraphicHeight(width, drag.startObject.actualWidth ?? width, drag.startObject.actualHeight ?? drag.startObject.height),
        } });
        return;
      }
      if (drag.startObject.kind === 'output-meter') {
        const width = Math.max(20, snap(drag.startObject.width + dx));
        updateDragPreview({ [drag.objectId]: { width, height: width } });
        return;
      }
      updateDragPreview({ [drag.objectId]: {
        width:  Math.max(20, snap(drag.startObject.width  + dx)),
        height: Math.max(16, snap(drag.startObject.height + dy)),
      } });
    }
  }

  function updateDragPreview(next: Record<string, Partial<EditorObject>>) {
    dragPreviewRef.current = next;
    setDragPreview(next);
  }

  function handlePointerUp() {
    const drag = dragRef.current;
    const preview = dragPreviewRef.current;
    if (drag && drag.type !== 'pan') {
      const startById = new Map((drag.type === 'move' ? drag.startObjects ?? [drag.startObject] : [drag.startObject]).map((object) => [object.id, object]));
      const updates = Object.entries(preview)
        .filter(([id, changes]) => {
          const startObject = startById.get(id);
          return startObject && hasObjectChanges(startObject, changes);
        })
        .map(([id, changes]) => ({ id, changes }));
      if (updates.length === 1) onUpdateObject(updates[0].id, updates[0].changes);
      else if (updates.length > 1) onUpdateObjects(updates);
    }
    dragRef.current = null;
    dragPreviewRef.current = {};
    setDragPreview({});
  }

  function hasObjectChanges(object: EditorObject, changes: Partial<EditorObject>) {
    return Object.entries(changes).some(([key, value]) => object[key as keyof EditorObject] !== value);
  }

  // ── Object drag handles ────────────────────────────────────────────────
  function beginMove(event: PointerEvent<HTMLElement>, object: EditorObject) {
    // During polygon point-building, let all clicks bubble to the mask handler for point placement.
    if (tool === 'output-polygon') return;

    // When a creation tool is active, let the click bubble up to the mask handler.
    if (CANVAS_TOOLS.has(tool)) {
      if (object.kind === 'button' && BUTTON_CHILD_TOOLS.has(tool)) {
        event.stopPropagation();
        createOnButton(event.clientX, event.clientY, object);
      }
      if (object.kind === 'container' && !object.hidden && CONTAINER_CHILD_TOOLS.has(tool)) {
        event.stopPropagation();
        createOnContainer(event.clientX, event.clientY, object);
      }
      return;
    }
    event.stopPropagation();
    const additiveSelection = event.shiftKey || event.metaKey || event.ctrlKey;
    const wasSelected = selectedIds.includes(object.id);
    onSelect(object.id, additiveSelection);

    if (additiveSelection) return;

    const now = window.performance.now();
    const lastClick = lastObjectClickRef.current;
    const isDoubleClick = object.kind === 'output-string'
      && lastClick?.id === object.id
      && now - lastClick.time <= 450;
    lastObjectClickRef.current = { id: object.id, time: now };

    if (isDoubleClick) {
      dragRef.current = null;
      dragPreviewRef.current = {};
      setDragPreview({});
      setEditingTextObjectId(object.id);
      return;
    }

    if (editingTextObjectId === object.id || object.locked) return;
    dragPreviewRef.current = {};
    setDragPreview({});
    dragRef.current = { type: 'move', objectId: object.id, startX: event.clientX, startY: event.clientY, startObject: object, startObjects: wasSelected ? selectedMovableObjects(object) : [object] };
    stageRef.current?.setPointerCapture(event.pointerId);
  }

  function beginResize(event: PointerEvent<HTMLSpanElement>, object: EditorObject) {
    event.stopPropagation();
    onSelect(object.id);
    if (object.locked) return;
    dragPreviewRef.current = {};
    setDragPreview({});
    dragRef.current = { type: 'resize', objectId: object.id, startX: event.clientX, startY: event.clientY, startObject: object };
    stageRef.current?.setPointerCapture(event.pointerId);
  }

  /** True when an object or any of its descendants is the current selection. */
  function isSelectedOrDescendant(object: EditorObject): boolean {
    if (selectedIds.includes(object.id)) return true;
    if (!object.childObjectIds) return false;
    return object.childObjectIds.some((childId) => {
      const child = objectById.get(childId);
      return child ? isSelectedOrDescendant(child) : false;
    });
  }

  function selectedMovableObjects(clickedObject: EditorObject) {
    const selected = selectedIds
      .map((id) => objectById.get(id))
      .filter((object): object is EditorObject => object !== undefined && !object.locked);
    const selectedSet = new Set(selected.map((object) => object.id));
    const topLevelSelected = selected.filter((object) => !hasSelectedAncestor(object, selectedSet));
    return topLevelSelected.length ? topLevelSelected : [clickedObject];
  }

  function hasSelectedAncestor(object: EditorObject, selectedSet: Set<string>) {
    let parentId = object.parentId;
    while (parentId) {
      if (selectedSet.has(parentId)) return true;
      parentId = objectById.get(parentId)?.parentId;
    }
    return false;
  }

  // ── Canvas object renderer ────────────────────────────────────────────
  function renderObject(object: EditorObject) {
    if (!isCanvasObjectRenderable(object)) return null;

    const renderedObject = dragPreview[object.id] ? { ...object, ...dragPreview[object.id] } : object;
    const selected = selectedIds.includes(renderedObject.id);
    const context = {
      project,
      objectById,
      editingTextObjectId,
      isSelected: selected,
      clipDisabled: isSelectedOrDescendant(renderedObject),
      onPatch: onUpdateObject,
      onEndEditing: () => setEditingTextObjectId(null),
      renderChildren: (parent: EditorObject) => visibleChildObjects(project, parent).map(renderObject),
    };
    const frameStyle = canvasObjectFrameStyle(renderedObject, context);

    return (
      <div
        key={renderedObject.id}
        className={`canvas-object object-${renderedObject.kind} ${selected ? 'selected-object' : ''}`}
        style={{
          left: renderedObject.x, top: renderedObject.y, width: renderedObject.width, height: renderedObject.height,
          zIndex: 20 + renderedObject.zIndex,
          ...frameStyle,
        }}
        onPointerDown={(e) => beginMove(e, renderedObject)}
        onDoubleClick={(e) => {
          if (renderedObject.kind !== 'output-string') return;
          e.stopPropagation();
          onSelect(renderedObject.id);
          setEditingTextObjectId(renderedObject.id);
        }}
      >
        {renderCanvasObjectContent(renderedObject, context)}

        {selected && renderedObject.kind !== 'object-pointer' && <span className="resize-handle" onPointerDown={(e) => beginResize(e, renderedObject)} />}
      </div>
    );
  }

  function handleContextMenu(event: React.MouseEvent) {
    if (buildingPolygon) {
      event.preventDefault();
      finalizePolygon();
    }
  }

  // ── Render ────────────────────────────────────────────────────────────
  return (
    <main
      ref={stageRef}
      className={`stage tool-${tool}`}
      onWheel={handleWheel}
      onPointerDown={handleStagePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
      onContextMenu={handleContextMenu}
    >
      <div className="world" style={{ transform: `translate(${viewport.x}px, ${viewport.y}px) scale(${viewport.zoom})` }}>
        {project.workingSet.visible && masks.map((mask) => {
          const renderedMask = dragPreview[mask.id] ? { ...mask, ...dragPreview[mask.id] } : mask;
          const children = getCanvasChildren(project, mask.id);

          // Resolve Soft Key Mask for this Data Mask (if assigned)
          const skm = mask.softKeyMaskId
            ? project.objects.find((o) => o.id === mask.softKeyMaskId && o.kind === 'soft-key-mask')
            : undefined;
          const skmKeys = skm ? getSoftKeyMaskKeys(project, skm.id) : [];

          return (
            <Fragment key={renderedMask.id}>
              {/* ── Data Mask ─────────────────────────────────────────── */}
              <div
                className={`vt-card interactive ${selectedIds.includes(renderedMask.id) ? 'selected-object' : ''}`}
                style={dataMaskFrameStyle(renderedMask)}
                onPointerDown={(e) => handleMaskPointerDown(e, renderedMask)}
              >
                <div className="mask-label">{renderedMask.id}</div>
                {children.map(renderObject)}

                {/* ── Polygon point-building preview ──────────────────── */}
                {buildingPolygon && buildingPolygon.maskId === mask.id && (
                  <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', overflow: 'visible' }}>
                    <svg width={renderedMask.width} height={renderedMask.height} style={{ overflow: 'visible' }}>
                      {buildingPolygon.points.length >= 3 && (
                        <polygon
                          points={buildingPolygon.points.map(p => `${p.x},${p.y}`).join(' ')}
                          fill="rgba(59,130,246,0.12)"
                        />
                      )}
                      {buildingPolygon.points.length >= 2 && (
                        <polyline
                          points={buildingPolygon.points.map(p => `${p.x},${p.y}`).join(' ')}
                          stroke="#3b82f6"
                          strokeWidth={2 / viewport.zoom}
                          strokeDasharray={`${4 / viewport.zoom},${4 / viewport.zoom}`}
                          fill="none"
                        />
                      )}
                      {buildingPolygon.points.map((p, i) => (
                        <circle key={i} cx={p.x} cy={p.y} r={4 / viewport.zoom} fill="white" stroke="#3b82f6" strokeWidth={2 / viewport.zoom} />
                      ))}
                    </svg>
                  </div>
                )}
              </div>

              {/* ── Soft Key Mask strip ───────────────────────────────── */}
              {skm && (
                <div
                  className={`vt-soft-key-mask ${selectedIds.includes(skm.id) ? 'selected-object' : ''}`}
                  style={softKeyMaskFrameStyle(renderedMask, skm)}
                  onPointerDown={(e) => { e.stopPropagation(); onSelect(skm.id, e.shiftKey || e.metaKey || e.ctrlKey); }}
                >
                  <div className="mask-label">{skm.id}</div>
                  {Array.from({ length: skm.softKeyCountPreview ?? SOFT_KEY_SLOTS }, (_, i) => {
                    const key = skmKeys[i];
                    const keySelected = key && selectedIds.includes(key.id);
                    const col = Math.floor(i / SOFT_KEY_ROWS);
                    const row = i % SOFT_KEY_ROWS;
                    return (
                      <div
                        key={key?.id ?? `skm-slot-${i}`}
                        className={`soft-key-slot ${keySelected ? 'key-selected' : ''}`}
                        style={softKeySlotStyle(key)}
                        onPointerDown={(e) => {
                          e.stopPropagation();
                          if (KEY_CHILD_TOOLS.has(tool) && key) {
                            createOnKeySlot(e.clientX, e.clientY, key, renderedMask.x + renderedMask.width + SOFT_KEY_GAP + col * SOFT_KEY_WIDTH, renderedMask.y + row * SOFT_KEY_SLOT_SIZE);
                            return;
                          }
                          onSelect(key?.id ?? skm.id, e.shiftKey || e.metaKey || e.ctrlKey);
                        }}
                      >
                        {key
                          ? <>
                              <div className="key-face" style={{ position: 'absolute', inset: 0, overflow: key && isSelectedOrDescendant(key) ? 'visible' : 'hidden' }}>
                                {(key.childObjectIds ?? [])
                                  .map((childId) => project.objects.find((candidate) => candidate.id === childId))
                                  .filter((candidate): candidate is EditorObject => candidate !== undefined && candidate.visible)
                                  .sort((a, b) => a.zIndex - b.zIndex)
                                  .map(renderObject)}
                              </div>
                              {((key.childObjectIds ?? []).length === 0) && <span className="soft-key-label">{key.label || key.name}</span>}
                            </>
                          : <span className="soft-key-empty">{i + 1}</span>
                        }
                      </div>
                    );
                  })}
                </div>
              )}
            </Fragment>
          );
        })}

        {/* ── Alarm Masks ─────────────────────────────────────────────── */}
        {alarmMasks.map((am) => {
          const renderedAm = dragPreview[am.id] ? { ...am, ...dragPreview[am.id] } : am;
          const children = getCanvasChildren(project, am.id);

          // Resolve Soft Key Mask for this Alarm Mask (if assigned)
          const skm = am.alarmSoftKeyMaskId
            ? project.objects.find((o) => o.id === am.alarmSoftKeyMaskId && o.kind === 'soft-key-mask')
            : undefined;
          const skmKeys = skm ? getSoftKeyMaskKeys(project, skm.id) : [];

          return (
            <Fragment key={renderedAm.id}>
              <div
                className={`vt-card interactive ${selectedIds.includes(renderedAm.id) ? 'selected-object' : ''}`}
                style={alarmMaskFrameStyle(renderedAm)}
                onPointerDown={(e) => handleMaskPointerDown(e, renderedAm)}
              >
                <div className="mask-label alarm">{renderedAm.id}</div>
                {children.map(renderObject)}
              </div>

              {/* ── Soft Key Mask strip ───────────────────────────────── */}
              {skm && (
                <div
                  className={`vt-soft-key-mask ${selectedIds.includes(skm.id) ? 'selected-object' : ''}`}
                  style={softKeyMaskFrameStyle(renderedAm, skm)}
                  onPointerDown={(e) => { e.stopPropagation(); onSelect(skm.id, e.shiftKey || e.metaKey || e.ctrlKey); }}
                >
                  <div className="mask-label">{skm.id}</div>
                  {Array.from({ length: skm.softKeyCountPreview ?? SOFT_KEY_SLOTS }, (_, i) => {
                    const key = skmKeys[i];
                    const keySelected = key && selectedIds.includes(key.id);
                    const col = Math.floor(i / SOFT_KEY_ROWS);
                    const row = i % SOFT_KEY_ROWS;
                    return (
                      <div
                        key={key?.id ?? `skm-slot-${i}`}
                        className={`soft-key-slot ${keySelected ? 'key-selected' : ''}`}
                        style={softKeySlotStyle(key)}
                        onPointerDown={(e) => {
                          e.stopPropagation();
                          if (KEY_CHILD_TOOLS.has(tool) && key) {
                            createOnKeySlot(e.clientX, e.clientY, key, renderedAm.x + renderedAm.width + SOFT_KEY_GAP + col * SOFT_KEY_WIDTH, renderedAm.y + row * SOFT_KEY_SLOT_SIZE);
                            return;
                          }
                          onSelect(key?.id ?? skm.id, e.shiftKey || e.metaKey || e.ctrlKey);
                        }}
                      >
                        {key
                          ? <>
                              <div className="key-face" style={{ position: 'absolute', inset: 0, overflow: key && isSelectedOrDescendant(key) ? 'visible' : 'hidden' }}>
                                {(key.childObjectIds ?? [])
                                  .map((childId) => project.objects.find((candidate) => candidate.id === childId))
                                  .filter((candidate): candidate is EditorObject => candidate !== undefined && candidate.visible)
                                  .sort((a, b) => a.zIndex - b.zIndex)
                                  .map(renderObject)}
                              </div>
                              {((key.childObjectIds ?? []).length === 0) && <span className="soft-key-label">{key.label || key.name}</span>}
                            </>
                          : <span className="soft-key-empty">{i + 1}</span>
                        }
                      </div>
                    );
                  })}
                </div>
              )}
            </Fragment>
          );
        })}
      </div>
    </main>
  );
}
