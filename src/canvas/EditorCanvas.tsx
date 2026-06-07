import { Fragment, type PointerEvent, type WheelEvent, useCallback, useRef, useState } from 'react';
import {
  BUTTON_FACE_INSET,
  BUTTON_OPTION_DISABLED,
  BUTTON_OPTION_LATCHED,
  BUTTON_OPTION_NO_BORDER,
  BUTTON_OPTION_SUPPRESS_BORDER,
  BUTTON_OPTION_TRANSPARENT_BACKGROUND,
  OUTPUT_NUMBER_OPTION_TRANSPARENT,
  OUTPUT_STRING_OPTION_AUTO_WRAP, OUTPUT_STRING_OPTION_TRANSPARENT, OUTPUT_STRING_OPTION_WRAP_ON_HYPHEN,
  clamp,
  horizontalJustificationToFlex, snap,
  verticalJustificationToFlex, vtColor,
} from '../domain/isobus';
import { getActiveMask, getCanvasChildren, getSoftKeyMaskKeys } from '../domain/selectors';
import type { DragState, EditorObject, ObjectKind, ProjectState, ToolMode, Viewport } from '../domain/types';
import { derivedPictureGraphicHeight } from '../domain/vtPalette';
import { OutputNumberContent } from '../objects/output-number/Render';
import { outputRectangleStyle } from '../objects/output-rectangle/logic';
import { OutputStringContent } from '../objects/output-string/Render';
import { PictureGraphicContent } from '../objects/picture-graphic/Render';
import { BottomControls, CanvasToolbar } from './CanvasToolbar';

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

const SKM_SLOTS = 6;
const SKM_WIDTH = 60;
const SKM_SLOT_SIZE = 60;
const SKM_GAP   = 4;

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

  const lineAttributes  = project.objects.filter((o) => o.kind === 'line-attribute');
  const fillAttributes  = project.objects.filter((o) => o.kind === 'fill-attribute');
  const fontAttributes  = project.objects.filter((o) => o.kind === 'font-attribute');
  const stringVariables = project.objects.filter((o) => o.kind === 'string-variable');
  const numberVariables = project.objects.filter((o) => o.kind === 'number-variable');
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

  // ── Canvas object renderer ────────────────────────────────────────────
  function renderObject(object: EditorObject) {
    if (object.kind === 'container' && object.hidden) return null;

    const line   = lineAttributes.find((a) => a.id === object.lineAttributeId);
    const fill   = fillAttributes.find((a) => a.id === object.fillAttributeId);
    const font   = fontAttributes.find((a) => a.id === object.fontAttributeId);
    const stringVariableReference = object.kind === 'output-string'
      ? object.variableReference !== undefined ? object.variableReference : object.stringVariableId || null
      : null;
    const numberVariableReference = object.kind === 'output-number'
      ? object.variableReference !== undefined ? object.variableReference : object.numberVariableId || null
      : null;
    const strVar = stringVariableReference ? stringVariables.find((v) => v.id === stringVariableReference) : undefined;
    const numVar = numberVariableReference ? numberVariables.find((v) => v.id === numberVariableReference) : undefined;
    const selected = selectedId === object.id;
    const buttonOptions = object.kind === 'button' ? object.buttonOptions ?? 0 : 0;
    const buttonNoBorder = (buttonOptions & BUTTON_OPTION_NO_BORDER) !== 0;
    const buttonSuppressBorder = (buttonOptions & BUTTON_OPTION_SUPPRESS_BORDER) !== 0;
    const buttonTransparent = (buttonOptions & BUTTON_OPTION_TRANSPARENT_BACKGROUND) !== 0;
    const buttonDisabled = (buttonOptions & BUTTON_OPTION_DISABLED) !== 0;
    const buttonLatched = (buttonOptions & BUTTON_OPTION_LATCHED) !== 0;
    const buttonFaceBackground = object.kind === 'button' && !buttonTransparent
      ? vtColor(object.backgroundColorIndex ?? 1)
      : 'transparent';
    const buttonChildren = object.kind === 'button'
      ? project.objects
        .filter((candidate) => (object.childObjectIds ?? []).includes(candidate.id) && candidate.visible)
        .sort((a, b) => a.zIndex - b.zIndex)
      : [];
    const containerChildren = object.kind === 'container'
      ? project.objects
        .filter((candidate) => (object.childObjectIds ?? []).includes(candidate.id) && candidate.visible)
        .sort((a, b) => a.zIndex - b.zIndex)
      : [];

    const fontWeight     = (font?.fontStyle ?? 0) & 1 ? 700        : undefined;
    const fontStyleCss   = (font?.fontStyle ?? 0) & 2 ? 'italic'   : undefined;
    const textDecoration = (font?.fontStyle ?? 0) & 4 ? 'underline': undefined;

    let borderColor: string | undefined;
    let borderWidth: number | undefined;
    let borderStyle: string | undefined;
    let borderTopWidth: number | undefined;
    let borderRightWidth: number | undefined;
    let borderBottomWidth: number | undefined;
    let borderLeftWidth: number | undefined;
    let backgroundImage: string | undefined;
    let backgroundRepeat: string | undefined;
    let background: string | undefined;
    let boxSizing: 'border-box' | undefined;

    if (object.kind === 'output-rectangle') {
      const style = outputRectangleStyle(object, line, fill, project.objects);
      borderColor = style.borderColor as string | undefined;
      borderStyle = style.borderStyle as string | undefined;
      borderTopWidth = style.borderTopWidth as number | undefined;
      borderRightWidth = style.borderRightWidth as number | undefined;
      borderBottomWidth = style.borderBottomWidth as number | undefined;
      borderLeftWidth = style.borderLeftWidth as number | undefined;
      boxSizing = style.boxSizing as 'border-box' | undefined;
      background = style.background as string | undefined;
      backgroundImage = style.backgroundImage as string | undefined;
      backgroundRepeat = style.backgroundRepeat as string | undefined;
    } else if (object.kind === 'button') {
      borderColor = buttonNoBorder || buttonSuppressBorder ? 'transparent' : vtColor(object.borderColorIndex ?? 0);
      borderWidth = buttonNoBorder ? 0 : BUTTON_FACE_INSET;
      borderStyle = 'solid';
      background  = 'transparent';
      boxSizing = 'border-box';
    } else if (object.kind === 'container') {
      borderColor = 'transparent';
      borderWidth = 0;
      borderStyle = 'solid';
      background = 'transparent';
      boxSizing = 'border-box';
    } else if (object.kind === 'output-string' || object.kind === 'output-number') {
      borderColor = object.borderColor;
      borderWidth = 1;
      borderStyle = 'solid';
      const transparentBit = object.kind === 'output-number' ? OUTPUT_NUMBER_OPTION_TRANSPARENT : OUTPUT_STRING_OPTION_TRANSPARENT;
      background = ((object.outputOptions ?? 0) & transparentBit) !== 0
        ? 'transparent'
        : vtColor(object.backgroundColorIndex ?? 1);
    } else {
      borderColor = object.borderColor;
      borderWidth = 1;
      borderStyle = 'solid';
      background  = object.backgroundColor;
    }

    const isEditingText = editingTextObjectId === object.id;
    const fontSizePx =
      object.kind === 'output-string' ? (font?.fontHeight ?? font?.fontSize ?? object.fontSize)
      : object.kind === 'output-number' ? (font?.fontHeight ?? font?.fontSize ?? 16)
      : object.fontSize;
    const outputStringAutoWrap = object.kind === 'output-string' && ((object.outputOptions ?? 0) & OUTPUT_STRING_OPTION_AUTO_WRAP) !== 0;
    const outputStringWrapOnHyphen = object.kind === 'output-string' && ((object.outputOptions ?? 0) & OUTPUT_STRING_OPTION_WRAP_ON_HYPHEN) !== 0;

    return (
      <div
        key={object.id}
        className={`canvas-object object-${object.kind} ${selected ? 'selected-object' : ''}`}
        style={{
          left: object.x, top: object.y, width: object.width, height: object.height,
          background, backgroundImage, backgroundRepeat,
          borderColor, borderWidth, borderStyle,
          borderTopWidth, borderRightWidth, borderBottomWidth, borderLeftWidth,
          boxSizing,
          zIndex: 20 + object.zIndex,
          opacity: buttonDisabled ? 0.55 : undefined,
          filter: buttonLatched ? 'brightness(0.88)' : undefined,
          boxShadow: buttonLatched ? 'inset 2px 2px 0 rgba(0, 0, 0, .35), inset -2px -2px 0 rgba(255, 255, 255, .25)' : undefined,
          cursor: buttonDisabled ? 'not-allowed' : undefined,
          fontSize: fontSizePx,
          fontFamily: (object.kind === 'output-string' || object.kind === 'output-number') && font?.proportional === false
            ? 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace'
            : undefined,
          color: (object.kind === 'output-string' || object.kind === 'output-number')
            ? vtColor(font?.fontColor ?? 0)
            : undefined,
          fontWeight, fontStyle: fontStyleCss, textDecoration,
          justifyContent: (object.kind === 'output-string' || object.kind === 'output-number')
            ? horizontalJustificationToFlex(object.horizontalJustification)
            : undefined,
          alignItems: (object.kind === 'output-string' || object.kind === 'output-number')
            ? verticalJustificationToFlex(object.verticalJustification)
            : undefined,
          whiteSpace: outputStringAutoWrap ? 'pre-wrap' : 'nowrap',
          overflowWrap: outputStringAutoWrap ? (outputStringWrapOnHyphen ? 'break-word' : 'normal') : undefined,
          wordBreak: outputStringAutoWrap ? 'normal' : undefined,
          hyphens: outputStringAutoWrap && outputStringWrapOnHyphen ? 'manual' : 'none',
        }}
        onPointerDown={(e) => beginMove(e, object)}
        onDoubleClick={(e) => {
          if (object.kind !== 'output-string') return;
          e.stopPropagation();
          onSelect(object.id);
          setEditingTextObjectId(object.id);
        }}
      >
        {/* Output String */}
        {object.kind === 'output-string' && (
          <OutputStringContent
            object={object}
            font={font}
            stringVariable={strVar}
            isEditing={isEditingText}
            onPatch={(changes) => onUpdateObject(object.id, changes)}
            onEndEditing={() => setEditingTextObjectId(null)}
          />
        )}

        {/* Output Number */}
        {object.kind === 'output-number' && (
          <OutputNumberContent object={object} font={font} numberVariable={numVar} />
        )}

        {/* Picture Graphic */}
        {object.kind === 'picture-graphic' && (
          <PictureGraphicContent object={object} />
        )}

        {/* Button children render inside the Button Face. */}
        {object.kind === 'button' && (
          <div
            className="button-face"
            style={{
              position: 'absolute',
              left: 0,
              top: 0,
              width: '100%',
              height: '100%',
              background: buttonFaceBackground,
              overflow: 'hidden',
            }}
          >
            {buttonChildren.map(renderObject)}
          </div>
        )}

        {object.kind === 'key' && (
          <div className="key-child-clip" style={{ position: 'absolute', inset: 0, overflow: 'hidden' }}>
            {project.objects
              .filter((candidate) => (object.childObjectIds ?? []).includes(candidate.id) && candidate.visible)
              .sort((a, b) => a.zIndex - b.zIndex)
              .map(renderObject)}
          </div>
        )}

        {/* Container children render clipped to the Container bounds. */}
        {object.kind === 'container' && (
          <>
            <div className="container-label">{object.name}</div>
            <div
              className="container-clip"
              style={{ position: 'absolute', inset: 0, overflow: 'hidden' }}
            >
              {containerChildren.map(renderObject)}
            </div>
          </>
        )}

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
      <CanvasToolbar tool={tool} onToolChange={onToolChange} />

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
                style={{
                  left: mask.x, top: mask.y, width: mask.width, height: mask.height,
                  background: mask.backgroundColor,
                  opacity: mask.visible ? 1 : 0,
                  pointerEvents: mask.visible ? 'auto' : 'none',
                  zIndex: mask.zIndex,
                }}
                onPointerDown={(e) => handleMaskPointerDown(e, mask)}
              >
                <div className="mask-label">{mask.id}</div>
                {children.map(renderObject)}
              </div>

              {/* ── Soft Key Mask strip ───────────────────────────────── */}
              {skm && (
                <div
                  className={`vt-soft-key-mask ${selectedId === skm.id ? 'selected-object' : ''}`}
                  style={{
                    left: mask.x + mask.width + SKM_GAP,
                    top:  mask.y,
                    width:  SKM_WIDTH,
                    height: SKM_SLOTS * SKM_SLOT_SIZE,
                    background: vtColor(skm.backgroundColorIndex ?? 1),
                    zIndex: mask.zIndex,
                  }}
                  onPointerDown={(e) => { e.stopPropagation(); onSelect(skm.id); }}
                >
                  <div className="mask-label">{skm.id}</div>
                  {Array.from({ length: SKM_SLOTS }, (_, i) => {
                    const key = skmKeys[i];
                    const keySelected = key && selectedId === key.id;
                    return (
                      <div
                        key={key?.id ?? `skm-slot-${i}`}
                        className={`soft-key-slot ${keySelected ? 'key-selected' : ''}`}
                        style={{ width: SKM_SLOT_SIZE, height: SKM_SLOT_SIZE, flex: `0 0 ${SKM_SLOT_SIZE}px`, background: key ? vtColor(key.backgroundColorIndex ?? 1) : undefined }}
                        onPointerDown={(e) => {
                          e.stopPropagation();
                          if (KEY_CHILD_TOOLS.has(tool) && key) {
                            createOnKeySlot(e.clientX, e.clientY, key, mask.x + mask.width + SKM_GAP, mask.y + i * SKM_SLOT_SIZE);
                            return;
                          }
                          onSelect(key?.id ?? skm.id);
                        }}
                      >
                        {key
                          ? <>
                              <div className="key-face" style={{ position: 'absolute', inset: 0, overflow: 'hidden' }}>
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

      <BottomControls
        zoom={viewport.zoom}
        onZoom={(zoom) => onViewportChange({ ...viewport, zoom: clamp(zoom, 0.25, 3) })}
      />
    </main>
  );
}
