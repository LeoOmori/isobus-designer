import type { PointerEvent, ReactNode } from 'react';
import type { EditorObject, ProjectState, ToolMode } from '../domain/types';
import {
  SOFT_KEY_GAP,
  SOFT_KEY_ROWS,
  SOFT_KEY_SLOTS,
  SOFT_KEY_SLOT_SIZE,
  SOFT_KEY_WIDTH,
  softKeyMaskFrameStyle,
  softKeySlotStyle,
} from '../objects/soft-key-mask';

/** Tools that, when active and clicked on a key slot, create a child inside that Key. */
const KEY_CHILD_TOOLS = new Set<ToolMode>([
  'container', 'output-rectangle', 'output-string', 'output-number', 'picture-graphic', 'object-pointer',
]);

export type SoftKeyMaskStripProps = {
  /** The Soft Key Mask object being rendered. */
  skm: EditorObject;
  /** The parent Data Mask / Alarm Mask the SKM strip is anchored to. */
  parentMask: EditorObject;
  /** Ordered keys referenced by `skm.keys`. */
  skmKeys: EditorObject[];
  selectedIds: string[];
  tool: ToolMode;
  project: ProjectState;
  /** True if the object or any descendant is currently selected (used to disable clipping). */
  isSelectedOrDescendant: (object: EditorObject) => boolean;
  /** Render a single canvas object (its frame + content + handles). */
  renderObject: (object: EditorObject) => ReactNode;
  onSelect: (id: string, additive?: boolean) => void;
  /**
   * Fired when a CANVAS tool is active and the user clicks an existing key slot —
   * caller is responsible for placing a child object inside that Key. The
   * `originX`/`originY` describe the world-space origin of the key slot.
   */
  onCreateKeyChild: (clientX: number, clientY: number, key: EditorObject, originX: number, originY: number) => void;
};

/**
 * Soft Key Mask strip displayed next to a Data Mask or Alarm Mask. Renders one
 * slot per declared key (or empty placeholder), wires selection, and forwards
 * clicks to `onCreateKeyChild` when a placement tool is active.
 */
export function SoftKeyMaskStrip({
  skm, parentMask, skmKeys, selectedIds, tool, project,
  isSelectedOrDescendant, renderObject, onSelect, onCreateKeyChild,
}: SoftKeyMaskStripProps) {
  const slotCount = skm.softKeyCountPreview ?? SOFT_KEY_SLOTS;

  function handleStripDown(event: PointerEvent<HTMLDivElement>) {
    event.stopPropagation();
    onSelect(skm.id, event.shiftKey || event.metaKey || event.ctrlKey);
  }

  return (
    <div
      className={`vt-soft-key-mask ${selectedIds.includes(skm.id) ? 'selected-object' : ''}`}
      style={softKeyMaskFrameStyle(parentMask, skm)}
      onPointerDown={handleStripDown}
    >
      <div className="mask-label">{skm.id}</div>
      {Array.from({ length: slotCount }, (_, slotIndex) => {
        const key = skmKeys[slotIndex];
        const col = Math.floor(slotIndex / SOFT_KEY_ROWS);
        const row = slotIndex % SOFT_KEY_ROWS;
        const originX = parentMask.x + parentMask.width + SOFT_KEY_GAP + col * SOFT_KEY_WIDTH;
        const originY = parentMask.y + row * SOFT_KEY_SLOT_SIZE;

        function handleSlotDown(event: PointerEvent<HTMLDivElement>) {
          event.stopPropagation();
          if (KEY_CHILD_TOOLS.has(tool) && key) {
            onCreateKeyChild(event.clientX, event.clientY, key, originX, originY);
            return;
          }
          onSelect(key?.id ?? skm.id, event.shiftKey || event.metaKey || event.ctrlKey);
        }

        return (
          <SoftKeySlot
            key={key?.id ?? `skm-slot-${slotIndex}`}
            slotIndex={slotIndex}
            slotKey={key}
            slotKeySelected={Boolean(key && selectedIds.includes(key.id))}
            project={project}
            isSelectedOrDescendant={isSelectedOrDescendant}
            renderObject={renderObject}
            onPointerDown={handleSlotDown}
          />
        );
      })}
    </div>
  );
}

function SoftKeySlot({
  slotIndex, slotKey, slotKeySelected, project,
  isSelectedOrDescendant, renderObject, onPointerDown,
}: {
  slotIndex: number;
  slotKey: EditorObject | undefined;
  slotKeySelected: boolean;
  project: ProjectState;
  isSelectedOrDescendant: (object: EditorObject) => boolean;
  renderObject: (object: EditorObject) => ReactNode;
  onPointerDown: (event: PointerEvent<HTMLDivElement>) => void;
}) {
  return (
    <div
      className={`soft-key-slot ${slotKeySelected ? 'key-selected' : ''}`}
      style={softKeySlotStyle(slotKey)}
      onPointerDown={onPointerDown}
    >
      {slotKey ? <SoftKeyContent slotKey={slotKey} project={project} isSelectedOrDescendant={isSelectedOrDescendant} renderObject={renderObject} />
              : <span className="soft-key-empty">{slotIndex + 1}</span>}
    </div>
  );
}

function SoftKeyContent({
  slotKey, project, isSelectedOrDescendant, renderObject,
}: {
  slotKey: EditorObject;
  project: ProjectState;
  isSelectedOrDescendant: (object: EditorObject) => boolean;
  renderObject: (object: EditorObject) => ReactNode;
}) {
  const children = (slotKey.childObjectIds ?? [])
    .map((childId) => project.objects.find((candidate) => candidate.id === childId))
    .filter((candidate): candidate is EditorObject => candidate !== undefined && candidate.visible)
    .sort((a, b) => a.zIndex - b.zIndex);

  return (
    <>
      <div
        className="key-face"
        style={{ position: 'absolute', inset: 0, overflow: isSelectedOrDescendant(slotKey) ? 'visible' : 'hidden' }}
      >
        {children.map(renderObject)}
      </div>
      {children.length === 0 && (
        <span className="soft-key-label">{slotKey.label || slotKey.name}</span>
      )}
    </>
  );
}
