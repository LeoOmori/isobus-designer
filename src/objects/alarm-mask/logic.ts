import { AlertTriangle } from 'lucide-react';
import type { CSSProperties } from 'react';
import { vtColor } from '../../domain/isobus';
import type { EditorObject, ProjectState } from '../../domain/types';
import { writeAlarmMask } from '../../domain/export/writers/alarmMask';
import { activeParent, toObjectId } from '../createHelpers';
import type { CreateObjectContext, ObjectLookup, ObjectMeta, ObjectModule } from '../ObjectModule';

export const alarmMaskMeta = {
  name: 'Alarm Mask', Icon: AlertTriangle, category: 'screen', isReference: false, hasLayout: true,
} satisfies ObjectMeta;

export function createDefaultAlarmMask({ current }: CreateObjectContext): EditorObject {
  const n = current.nextNumber;
  const parent = activeParent(current, current.activeMaskId);
  return {
    id: `AM_${n}`,
    objectId: toObjectId('alarm-mask', current),
    name: `Alarm Mask ${n}`,
    kind: 'alarm-mask',
    visible: true,
    locked: false,
    zIndex: current.objects.length + 1,
    x: parent.x + 140,
    y: parent.y + 80,
    width: 480,
    height: 480,
    backgroundColor: '#ffffff',
    backgroundColorIndex: 1,
    borderColor: '#dfe6f0',
    childObjectIds: [],
    alarmSoftKeyMaskId: '',
    priority: 1,
    acousticSignal: 3,
    macros: [],
  };
}

export function validateAlarmMask(obj: EditorObject, _project: ProjectState, _lookup: ObjectLookup): string[] {
  const errors: string[] = [];
  if (obj.priority !== undefined && ![0, 1, 2].includes(obj.priority)) {
    errors.push(`Alarm Mask ${obj.id}: priority must be 0 (high), 1 (medium), or 2 (low)`);
  }
  if (obj.acousticSignal !== undefined && ![0, 1, 2, 3].includes(obj.acousticSignal)) {
    errors.push(`Alarm Mask ${obj.id}: acousticSignal must be 0–3`);
  }
  if (obj.alarmSoftKeyMaskId) {
    const skmExists = _project.objects.some((candidate) => candidate.id === obj.alarmSoftKeyMaskId && candidate.kind === 'soft-key-mask');
    if (!skmExists) {
      errors.push(`Alarm Mask ${obj.id}: alarmSoftKeyMaskId "${obj.alarmSoftKeyMaskId}" not found`);
    }
  }
  return errors;
}

export function alarmMaskFrameStyle(mask: EditorObject): CSSProperties {
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

export const alarmMaskModule = {
  kind: 'alarm-mask',
  meta: alarmMaskMeta,
  exportOrder: 13,
  writer: writeAlarmMask,
  createDefault: createDefaultAlarmMask,
  validate: validateAlarmMask,
} satisfies ObjectModule<'alarm-mask'>;
