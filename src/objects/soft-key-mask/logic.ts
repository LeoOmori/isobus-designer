import { Keyboard } from 'lucide-react';
import type { CSSProperties } from 'react';
import { vtColor } from '../../domain/isobus';
import type { EditorObject, ProjectState } from '../../domain/types';
import { writeSoftKeyMask } from '../../domain/export/writers/softKeyMask';
import { toObjectId } from '../createHelpers';
import type { CreateObjectContext, ObjectLookup, ObjectMeta, ObjectModule } from '../ObjectModule';

export const SOFT_KEY_SLOTS = 6;
export const SOFT_KEY_WIDTH = 60;
export const SOFT_KEY_SLOT_SIZE = 60;
export const SOFT_KEY_GAP = 4;

export const softKeyMaskMeta = {
  name: 'Soft Key Mask', Icon: Keyboard, category: 'screen', isReference: false, hasLayout: false,
} satisfies ObjectMeta;

export function createDefaultSoftKeyMask({ current }: CreateObjectContext): EditorObject {
  const n = current.nextNumber;
  return {
    id: `SKM_${n}`,
    objectId: toObjectId('soft-key-mask', current),
    name: `Soft Key Mask ${n}`,
    kind: 'soft-key-mask',
    visible: true,
    locked: false,
    zIndex: current.objects.length + 1,
    x: 0,
    y: 0,
    width: 0,
    height: 0,
    backgroundColor: 'transparent',
    backgroundColorIndex: 1,
    borderColor: '#dfe6f0',
    keys: [],
    layoutPreview: 'vertical',
    softKeyCountPreview: 6,
  };
}

export function validateSoftKeyMask(obj: EditorObject, _project: ProjectState, { objectById }: ObjectLookup): string[] {
  const errors: string[] = [];
  const keys = obj.keys ?? [];
  if (!Number.isInteger(obj.backgroundColorIndex ?? 1) || (obj.backgroundColorIndex ?? 1) < 0 || (obj.backgroundColorIndex ?? 1) > 255) errors.push(`Soft Key Mask ${obj.id}: backgroundColorIndex must be 0–255`);
  if (keys.length > 0xff) errors.push(`Soft Key Mask ${obj.id}: key count must fit uint8`);
  if ((obj.macros ?? []).length > 0xff) errors.push(`Soft Key Mask ${obj.id}: macro count must fit uint8`);
  const seen = new Set<string>();
  for (const keyId of keys) {
    if (seen.has(keyId)) {
      errors.push(`Soft Key Mask ${obj.id}: duplicate key reference "${keyId}"`);
      continue;
    }
    seen.add(keyId);
    const key = objectById.get(keyId);
    if (!key || key.kind !== 'key') errors.push(`Soft Key Mask ${obj.id}: key "${keyId}" must reference an existing Key object`);
  }
  return errors;
}

export function validateSoftKeyMaskForExport(obj: EditorObject): string[] {
  return (obj.keys ?? []).length > 0xff ? [`Export: Soft Key Mask ${obj.id} has more than 255 key references`] : [];
}

/** Max rows per column in the soft key mask preview. */
export const SOFT_KEY_ROWS = 6;

/**
 * Gap between slots in the soft key mask preview (px). Must stay in sync with
 * the `gap` value in `.vt-soft-key-mask` CSS.
 */
export const SKM_SLOT_GAP = 2;

/**
 * Border width on `.vt-soft-key-mask` (1px all sides). Must stay in sync with CSS.
 * Added to height/width so `border-box` sizing doesn't clip the last slot row/column.
 */
const SKM_BORDER = 2; // top + bottom (or left + right)

export function softKeyMaskFrameStyle(mask: EditorObject, softKeyMask: EditorObject): CSSProperties {
  const count = softKeyMask.softKeyCountPreview ?? SOFT_KEY_SLOTS;
  const cols = Math.max(1, Math.ceil(count / SOFT_KEY_ROWS));
  const rows = Math.min(count, SOFT_KEY_ROWS);
  return {
    left: mask.x + mask.width + SOFT_KEY_GAP,
    top: mask.y,
    width: cols * SOFT_KEY_WIDTH + (cols - 1) * SKM_SLOT_GAP + SKM_BORDER,
    height: rows * SOFT_KEY_SLOT_SIZE + (rows - 1) * SKM_SLOT_GAP + SKM_BORDER,
    background: vtColor(softKeyMask.backgroundColorIndex ?? 1),
    zIndex: mask.zIndex,
  };
}

export function softKeySlotStyle(key: EditorObject | undefined): CSSProperties {
  return {
    width: SOFT_KEY_SLOT_SIZE,
    height: SOFT_KEY_SLOT_SIZE,
    flex: `0 0 ${SOFT_KEY_SLOT_SIZE}px`,
    background: key ? vtColor(key.backgroundColorIndex ?? 1) : undefined,
  };
}

export const softKeyMaskModule = {
  kind: 'soft-key-mask',
  meta: softKeyMaskMeta,
  exportOrder: 12,
  writer: writeSoftKeyMask,
  createDefault: createDefaultSoftKeyMask,
  validate: validateSoftKeyMask,
  validateExport: validateSoftKeyMaskForExport,
} satisfies ObjectModule<'soft-key-mask'>;
