import { Fragment, type PointerEvent, type WheelEvent, useCallback, useRef, useState } from 'react';
import {
  OUTPUT_STRING_OPTION_AUTO_WRAP, OUTPUT_STRING_OPTION_TRANSPARENT, OUTPUT_STRING_OPTION_WRAP_ON_HYPHEN,
  clamp, fillTypeToBackground, fontCellScaleX, formatOutputNumber,
  horizontalJustificationToFlex, lineArtToCss, snap,
  textJustificationTransformOrigin, verticalJustificationToFlex, vtColor,
} from '../domain/isobus';
import { getActiveMask, getCanvasChildren, getSoftKeyMaskKeys } from '../domain/selectors';
import type { DragState, EditorObject, ObjectKind, ProjectState, ToolMode, Viewport } from '../domain/types';
import {
  PICTURE_GRAPHIC_OPTION_FLASHING,
  derivedPictureGraphicHeight,
  pictureGraphicToDataUrl,
} from '../domain/vtPalette';
import { BottomControls, CanvasToolbar } from './CanvasToolbar';

/** Tools that create a canvas object on click. */
const CANVAS_TOOLS = new Set<ToolMode>([
  'output-rectangle', 'output-string', 'button', 'output-number', 'picture-graphic',
]);

const SKM_SLOTS = 6;
const SKM_WIDTH = 60;
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

  // ── Coordinate helpers ────────────────────────────────────────────────
  const screenToWorld = useCallback((clientX: number, clientY: number) => {
    const rect = stageRef.current!.getBoundingClientRect();
    return {
      x: (clientX - rect.left - viewport.x) / viewport.zoom,
      y: (clientY - rect.top  - viewport.y) / viewport.zoom,
    };
  }, [viewport]);

  const screenToMask = useCallback((clientX: number, clientY: number, mask = activeMask) => {
    const world = screenToWorld(clientX, clientY);
    return { x: world.x - mask.x, y: world.y - mask.y };
  }, [activeMask, screenToWorld]);

  /** Returns the topmost visible Data Mask under the pointer, or the active mask. */
  function findMaskAt(clientX: number, clientY: number): EditorObject {
    const world = screenToWorld(clientX, clientY);
    return [...masks]
      .sort((a, b) => b.zIndex - a.zIndex)
      .find((m) =>
        world.x >= m.x && world.x <= m.x + m.width &&
        world.y >= m.y && world.y <= m.y + m.height,
      ) ?? activeMask;
  }

  /** Shared canvas-tool create + reset helper. */
  function createOnMask(clientX: number, clientY: number, mask: EditorObject) {
    const point = screenToMask(clientX, clientY, mask);
    onSelect(mask.id);
    onCreateObject(tool as ObjectKind, snap(point.x), snap(point.y), mask.id);
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
    onSelect(activeMask.id);
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
    if (CANVAS_TOOLS.has(tool)) return;
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
    const line   = lineAttributes.find((a) => a.id === object.lineAttributeId);
    const fill   = fillAttributes.find((a) => a.id === object.fillAttributeId);
    const font   = fontAttributes.find((a) => a.id === object.fontAttributeId);
    const variableReference = object.variableReference !== undefined ? object.variableReference : object.stringVariableId || null;
    const strVar = variableReference ? stringVariables.find((v) => v.id === variableReference) : undefined;
    const numVar = numberVariables.find((v) => v.id === object.numberVariableId);
    const selected = selectedId === object.id;

    const fontWeight     = (font?.fontStyle ?? 0) & 1 ? 700        : undefined;
    const fontStyleCss   = (font?.fontStyle ?? 0) & 2 ? 'italic'   : undefined;
    const textDecoration = (font?.fontStyle ?? 0) & 4 ? 'underline': undefined;
    const textScaleX     = object.kind === 'output-string' ? fontCellScaleX(font) : 1;

    let borderColor: string | undefined;
    let borderWidth: number | undefined;
    let borderStyle: string | undefined;
    let background: string | undefined;

    if (object.kind === 'output-rectangle') {
      borderColor = vtColor(line?.lineColor ?? 0);
      borderWidth = line?.lineWidth ?? 1;
      borderStyle = lineArtToCss(line?.lineArt);
      background  = fillTypeToBackground(fill?.fillType, vtColor(fill?.fillColor ?? 15));
    } else if (object.kind === 'button') {
      const hasBorder = ((object.buttonOptions ?? 1) & 1) !== 0;
      borderColor = hasBorder ? '#4b5563' : 'transparent';
      borderWidth = hasBorder ? 2 : 0;
      borderStyle = 'solid';
      background  = object.backgroundColor;
    } else if (object.kind === 'output-string' || object.kind === 'output-number') {
      borderColor = object.borderColor;
      borderWidth = 1;
      borderStyle = 'solid';
      background = ((object.outputOptions ?? 0) & OUTPUT_STRING_OPTION_TRANSPARENT) !== 0
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
          background, borderColor, borderWidth, borderStyle,
          zIndex: 20 + object.zIndex,
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
            : object.kind === 'button' ? 'center' : undefined,
          alignItems: (object.kind === 'output-string' || object.kind === 'output-number')
            ? verticalJustificationToFlex(object.verticalJustification)
            : object.kind === 'button' ? 'center' : undefined,
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
          isEditingText
            ? (
              <input
                className="inline-text-input" autoFocus
                value={object.text ?? ''}
                style={{ transform: `scaleX(${textScaleX})`, transformOrigin: textJustificationTransformOrigin(object.horizontalJustification) }}
                onPointerDown={(e) => e.stopPropagation()}
                onDoubleClick={(e) => e.stopPropagation()}
                onChange={(e) => onUpdateObject(object.id, { text: e.target.value })}
                onKeyDown={(e) => { if (e.key === 'Enter' || e.key === 'Escape') { e.preventDefault(); setEditingTextObjectId(null); } }}
                onBlur={() => setEditingTextObjectId(null)}
              />
            ) : (
              <span className="inline-text-editor" style={{ transform: `scaleX(${textScaleX})`, transformOrigin: textJustificationTransformOrigin(object.horizontalJustification) }}>
                {clipUtf8(strVar?.stringValue ?? object.text ?? '', object.length)}
              </span>
            )
        )}

        {/* Output Number */}
        {object.kind === 'output-number' && (
          <span className="inline-text-editor">
            {formatOutputNumber(
              numVar?.value ?? object.value ?? 0,
              object.offset ?? 0, object.scale ?? 1,
              object.numberOfDecimals ?? 0, object.numberFormat ?? 0,
            )}
          </span>
        )}

        {/* Picture Graphic */}
        {object.kind === 'picture-graphic' && (
          (() => {
            const imgUrl = pictureGraphicToDataUrl(object);
            const targetWidth = object.targetWidth ?? object.width;
            const targetHeight = derivedPictureGraphicHeight(targetWidth, object.actualWidth ?? targetWidth, object.actualHeight ?? object.height);
            return imgUrl
              ? <img src={imgUrl} alt={object.name} draggable={false} onDragStart={(e) => e.preventDefault()} className={(object.graphicOptions ?? 0) & PICTURE_GRAPHIC_OPTION_FLASHING ? 'picture-graphic-flashing' : undefined} style={{ width: targetWidth, height: targetHeight, objectFit: 'fill', userSelect: 'none', imageRendering: 'pixelated' }} />
              : <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#9ca3af', fontSize: 11 }}>🖼 {object.name}</div>;
          })()
        )}

        {/* Button */}
        {object.kind === 'button' && (
          <span style={{ fontSize: font?.fontHeight ?? 13, fontWeight, fontStyle: fontStyleCss, textDecoration, color: vtColor(font?.fontColor ?? 0) }}>
            {object.label ?? object.text ?? ''}
          </span>
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
                    height: mask.height,
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
                        key={i}
                        className={`soft-key-slot ${keySelected ? 'key-selected' : ''}`}
                        onPointerDown={(e) => { e.stopPropagation(); onSelect(key?.id ?? skm.id); }}
                      >
                        {key
                          ? <span className="soft-key-label">{key.label || key.name}</span>
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

function clipUtf8(value: string, maxBytes: number | undefined) {
  if (!maxBytes || maxBytes < 0 || maxBytes >= utf8ByteLength(value)) return value;

  let result = '';
  let bytes = 0;
  for (const char of value) {
    const charBytes = utf8ByteLength(char);
    if (bytes + charBytes > maxBytes) break;
    result += char;
    bytes += charBytes;
  }
  return result;
}

function utf8ByteLength(value: string) {
  return new TextEncoder().encode(value).length;
}
