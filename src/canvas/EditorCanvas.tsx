import { Fragment, type PointerEvent, type WheelEvent, useCallback, useRef, useState } from 'react';
import {
  BUTTON_FACE_INSET,
  BUTTON_OPTION_NO_BORDER,
  clamp,
  snap,
} from '../domain/isobus';
import { getActiveMask, getCanvasChildren, getSoftKeyMaskKeys } from '../domain/selectors';
import type { DragState, EditorObject, ObjectKind, ProjectState, ToolMode, Viewport } from '../domain/types';
import { derivedPictureGraphicHeight } from '../domain/vtPalette';
import { dataMaskFrameStyle } from '../objects/data-mask';
import { buttonFrameStyle } from '../objects/button';
import { canvasObjectFrameStyle, isCanvasObjectRenderable, renderCanvasObjectContent, visibleChildObjects } from '../objects/canvasRenderRegistry';
import { SOFT_KEY_GAP, SOFT_KEY_SLOT_SIZE, SOFT_KEY_SLOTS, SOFT_KEY_ROWS, SOFT_KEY_WIDTH, softKeyMaskFrameStyle, softKeySlotStyle } from '../objects/soft-key-mask';


/** Tools that create a canvas object on click. */
const CANVAS_TOOLS = new Set<ToolMode>([
  'container', 'output-rectangle', 'output-string', 'button', 'output-number', 'picture-graphic',
]);

const BUTTON_CHILD_TOOLS = new Set<ToolMode>([
  'output-rectangle', 'output-string', 'output-number', 'picture-graphic',
]);

const CONTAINER_CHILD_TOOLS = new Set<ToolMode>([
  'container', 'output-rectangle', 'output-string', 'button', 'output-number', 'picture-graphic',
]);

const KEY_CHILD_TOOLS = new Set<ToolMode>([
  'container', 'output-rectangle', 'output-string', 'output-number', 'picture-graphic',
]);

export function EditorCanvas({
  project, selectedId, viewport, tool,
  onSelect, onViewportChange, onToolChange, onCreateObject, onUpdateObject,
}: {
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
  const dragRef  = useRef<DragState | null>(null);
  const [editingTextObjectId, setEditingTextObjectId] = useState<string | null>(null);

  const activeMask = getActiveMask(project);
  const masks      = project.objects.filter((o) => o.kind === 'data-mask' && o.visible);

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
    if (CANVAS_TOOLS.has(tool)) {
      createOnMask(event.clientX, event.clientY, mask);
      return;
    }
    onSelect(mask.id);
    if (tool !== 'select' || mask.locked) return;
    dragRef.current = { type: 'move', objectId: mask.id, startX: event.clientX, startY: event.clientY, startObject: mask };
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
      onUpdateObject(drag.objectId, { x: snap(drag.startObject.x + dx), y: snap(drag.startObject.y + dy) });
    } else {
      if (drag.startObject.kind === 'picture-graphic') {
        const width = Math.max(20, snap(drag.startObject.width + dx));
        onUpdateObject(drag.objectId, {
          targetWidth: width,
          width,
          height: derivedPictureGraphicHeight(width, drag.startObject.actualWidth ?? width, drag.startObject.actualHeight ?? drag.startObject.height),
        });
        return;
      }
      onUpdateObject(drag.objectId, {
        width:  Math.max(20, snap(drag.startObject.width  + dx)),
        height: Math.max(16, snap(drag.startObject.height + dy)),
      });
    }
  }

  // ── Object drag handles ────────────────────────────────────────────────
  function beginMove(event: PointerEvent<HTMLElement>, object: EditorObject) {
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

  /** True when an object or any of its descendants is the current selection. */
  function isSelectedOrDescendant(object: EditorObject): boolean {
    if (selectedId === object.id) return true;
    if (!object.childObjectIds) return false;
    return object.childObjectIds.some((childId) => {
      const child = objectById.get(childId);
      return child ? isSelectedOrDescendant(child) : false;
    });
  }

  // ── Canvas object renderer ────────────────────────────────────────────
  function renderObject(object: EditorObject) {
    if (!isCanvasObjectRenderable(object)) return null;

    const selected = selectedId === object.id;
    const context = {
      project,
      objectById,
      editingTextObjectId,
      isSelected: selected,
      clipDisabled: isSelectedOrDescendant(object),
      onPatch: onUpdateObject,
      onEndEditing: () => setEditingTextObjectId(null),
      renderChildren: (parent: EditorObject) => visibleChildObjects(project, parent).map(renderObject),
    };
    const frameStyle = canvasObjectFrameStyle(object, context);

    return (
      <div
        key={object.id}
        className={`canvas-object object-${object.kind} ${selected ? 'selected-object' : ''}`}
        style={{
          left: object.x, top: object.y, width: object.width, height: object.height,
          zIndex: 20 + object.zIndex,
          ...frameStyle,
        }}
        onPointerDown={(e) => beginMove(e, object)}
        onDoubleClick={(e) => {
          if (object.kind !== 'output-string') return;
          e.stopPropagation();
          onSelect(object.id);
          setEditingTextObjectId(object.id);
        }}
      >
        {renderCanvasObjectContent(object, context)}

        {selected && <span className="resize-handle" onPointerDown={(e) => beginResize(e, object)} />}
      </div>
    );
  }

  // ── Render ────────────────────────────────────────────────────────────
  return (
    <main
      ref={stageRef}
      className={`stage tool-${tool}`}
      onWheel={handleWheel}
      onPointerDown={handleStagePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={() => { dragRef.current = null; }}
    >
      <div className="world" style={{ transform: `translate(${viewport.x}px, ${viewport.y}px) scale(${viewport.zoom})` }}>
        {project.workingSet.visible && masks.map((mask) => {
          const children = getCanvasChildren(project, mask.id);

          // Resolve Soft Key Mask for this Data Mask (if assigned)
          const skm = mask.softKeyMaskId
            ? project.objects.find((o) => o.id === mask.softKeyMaskId && o.kind === 'soft-key-mask')
            : undefined;
          const skmKeys = skm ? getSoftKeyMaskKeys(project, skm.id) : [];

          return (
            <Fragment key={mask.id}>
              {/* ── Data Mask ─────────────────────────────────────────── */}
              <div
                className={`vt-card interactive ${selectedId === mask.id ? 'selected-object' : ''}`}
                style={dataMaskFrameStyle(mask)}
                onPointerDown={(e) => handleMaskPointerDown(e, mask)}
              >
                <div className="mask-label">{mask.id}</div>
                {children.map(renderObject)}
              </div>

              {/* ── Soft Key Mask strip ───────────────────────────────── */}
              {skm && (
                <div
                  className={`vt-soft-key-mask ${selectedId === skm.id ? 'selected-object' : ''}`}
                  style={softKeyMaskFrameStyle(mask, skm)}
                  onPointerDown={(e) => { e.stopPropagation(); onSelect(skm.id); }}
                >
                  <div className="mask-label">{skm.id}</div>
                  {Array.from({ length: skm.softKeyCountPreview ?? SOFT_KEY_SLOTS }, (_, i) => {
                    const key = skmKeys[i];
                    const keySelected = key && selectedId === key.id;
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
                            createOnKeySlot(e.clientX, e.clientY, key, mask.x + mask.width + SOFT_KEY_GAP + col * SOFT_KEY_WIDTH, mask.y + row * SOFT_KEY_SLOT_SIZE);
                            return;
                          }
                          onSelect(key?.id ?? skm.id);
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
