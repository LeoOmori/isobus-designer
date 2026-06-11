import { LayoutPanelLeft } from 'lucide-react';
import type { CSSProperties } from 'react';
import { vtColor } from '../../domain/isobus';
import type { EditorObject, ProjectState } from '../../domain/types';
import { writeDataMask } from '../../domain/export/writers/dataMask';
import { activeParent, toObjectId } from '../createHelpers';
import type { CreateObjectContext, ObjectLookup, ObjectMeta, ObjectModule } from '../ObjectModule';

export const dataMaskMeta = {
  name: 'Data Mask', Icon: LayoutPanelLeft, category: 'screen', isReference: false, hasLayout: true,
} satisfies ObjectMeta;

export function createDefaultDataMask({ current }: CreateObjectContext): EditorObject {
  const n = current.nextNumber;
  const parent = activeParent(current, current.activeMaskId);
  return {
    id: `DM_${n}`,
    objectId: toObjectId('data-mask', current),
    name: `Data Mask ${n}`,
    kind: 'data-mask',
    visible: true,
    locked: false,
    zIndex: current.objects.length + 1,
    x: parent.x + 80,
    y: parent.y + 80,
    width: 480,
    height: 480,
    backgroundColor: '#ffffff',
    backgroundColorIndex: 1,
    borderColor: '#dfe6f0',
    childObjectIds: [],
    softKeyMaskId: '',
    nextMaskId: '',
    previousMaskId: '',
  };
}

export function validateDataMask(obj: EditorObject, project: ProjectState, _lookup: ObjectLookup): string[] {
  if (!obj.softKeyMaskId) return [];
  const skmExists = project.objects.some((candidate) => candidate.id === obj.softKeyMaskId && candidate.kind === 'soft-key-mask');
  return skmExists ? [] : [`Data Mask ${obj.id}: softKeyMaskId "${obj.softKeyMaskId}" not found`];
}

export function dataMaskFrameStyle(mask: EditorObject): CSSProperties {
  return {
    left: mask.x,
    top: mask.y,
    width: mask.width,
    height: mask.height,
    background: vtColor(mask.backgroundColorIndex ?? 1),
    opacity: mask.visible ? 1 : 0,
    pointerEvents: mask.visible ? 'auto' : 'none',
    zIndex: mask.zIndex,
  };
}

export const dataMaskModule = {
  kind: 'data-mask',
  meta: dataMaskMeta,
  exportOrder: 13,
  writer: writeDataMask,
  createDefault: createDefaultDataMask,
  validate: validateDataMask,
} satisfies ObjectModule<'data-mask'>;
