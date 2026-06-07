import { MousePointerClick } from 'lucide-react';
import type { CSSProperties, ReactNode } from 'react';
import {
  BUTTON_FACE_INSET,
  BUTTON_OPTION_DISABLED,
  BUTTON_OPTION_LATCHABLE,
  BUTTON_OPTION_LATCHED,
  BUTTON_OPTION_NO_BORDER,
  BUTTON_OPTION_SUPPRESS_BORDER,
  BUTTON_OPTION_TRANSPARENT_BACKGROUND,
  vtColor,
} from '../../domain/isobus';
import type { EditorObject, ProjectState } from '../../domain/types';
import { writeButton } from '../../domain/export/writers/button';
import { createCanvasBase } from '../createHelpers';
import type { CreateObjectContext, ObjectLookup, ObjectMeta, ObjectModule } from '../ObjectModule';

export const BUTTON_CHILD_KINDS = new Set<EditorObject['kind']>(['output-string', 'output-number', 'output-rectangle', 'picture-graphic']);

export const buttonMeta = {
  name: 'Button', Icon: MousePointerClick, category: 'input', isReference: false, hasLayout: true,
} satisfies ObjectMeta;

export function createDefaultButton({ current, x, y, parentId }: CreateObjectContext): EditorObject {
  return {
    ...createCanvasBase('button', buttonMeta.name, current, x, y, parentId, 120, 42),
    borderColorIndex: 0,
    childObjectIds: [],
    keyCode: 0,
    buttonOptions: 0,
  };
}

export function validateButton(obj: EditorObject, _project: ProjectState, { objectById }: ObjectLookup): string[] {
  const errors: string[] = [];
  const keyCode = obj.keyCode ?? 0;
  const options = obj.buttonOptions ?? 0;
  const backgroundColorIndex = obj.backgroundColorIndex ?? 1;
  const borderColorIndex = obj.borderColorIndex ?? 0;
  if (!Number.isInteger(keyCode) || keyCode < 0 || keyCode > 0xff) errors.push(`Button ${obj.id}: keyCode must be 0–255`);
  if (!Number.isInteger(options) || options < 0 || options > 0xff) errors.push(`Button ${obj.id}: buttonOptions must be 0–255`);
  else if (options & 0b11000000) errors.push(`Button ${obj.id}: reserved option bits 6-7 must be 0`);
  if ((options & BUTTON_OPTION_LATCHED) && !(options & BUTTON_OPTION_LATCHABLE)) errors.push(`Button ${obj.id}: latched requires latchable`);
  if (!Number.isInteger(obj.width) || obj.width <= 0 || obj.width > 0xffff || !Number.isInteger(obj.height) || obj.height <= 0 || obj.height > 0xffff) errors.push(`Button ${obj.id}: width/height must fit uint16`);
  if (!Number.isInteger(backgroundColorIndex) || backgroundColorIndex < 0 || backgroundColorIndex > 0xff) errors.push(`Button ${obj.id}: backgroundColorIndex must be 0–255`);
  if (!Number.isInteger(borderColorIndex) || borderColorIndex < 0 || borderColorIndex > 0xff) errors.push(`Button ${obj.id}: borderColorIndex must be 0–255`);

  for (const childId of obj.childObjectIds ?? []) {
    const child = objectById.get(childId);
    if (!child || !BUTTON_CHILD_KINDS.has(child.kind)) {
      errors.push(`Button ${obj.id}: child "${childId}" must be Output String/Number/Rectangle or Picture Graphic`);
      continue;
    }
    if (child.parentId !== obj.id) errors.push(`Button ${obj.id}: child "${childId}" parentId must reference the Button`);
    if (!Number.isInteger(child.x) || child.x < -0x8000 || child.x > 0x7fff || !Number.isInteger(child.y) || child.y < -0x8000 || child.y > 0x7fff) errors.push(`Button ${obj.id}: child "${childId}" coordinates must fit int16`);
  }
  return errors;
}

export function buttonFrameStyle(object: EditorObject): CSSProperties {
  const options = object.buttonOptions ?? 0;
  const noBorder = (options & BUTTON_OPTION_NO_BORDER) !== 0;
  const suppressBorder = (options & BUTTON_OPTION_SUPPRESS_BORDER) !== 0;
  const disabled = (options & BUTTON_OPTION_DISABLED) !== 0;
  const latched = (options & BUTTON_OPTION_LATCHED) !== 0;
  return {
    borderColor: noBorder || suppressBorder ? 'transparent' : vtColor(object.borderColorIndex ?? 0),
    borderWidth: noBorder ? 0 : BUTTON_FACE_INSET,
    borderStyle: 'solid',
    background: 'transparent',
    boxSizing: 'border-box',
    opacity: disabled ? 0.55 : undefined,
    filter: latched ? 'brightness(0.88)' : undefined,
    boxShadow: latched ? 'inset 2px 2px 0 rgba(0, 0, 0, .35), inset -2px -2px 0 rgba(255, 255, 255, .25)' : undefined,
    cursor: disabled ? 'not-allowed' : undefined,
  };
}

export function buttonFaceBackground(object: EditorObject) {
  return ((object.buttonOptions ?? 0) & BUTTON_OPTION_TRANSPARENT_BACKGROUND) !== 0 ? 'transparent' : vtColor(object.backgroundColorIndex ?? 1);
}

export function ButtonContent({ object, children, clipDisabled }: { object: EditorObject; children: ReactNode; clipDisabled?: boolean }) {
  return (
    <div className="button-face" style={{ position: 'absolute', left: 0, top: 0, width: '100%', height: '100%', background: buttonFaceBackground(object), overflow: clipDisabled ? 'visible' : 'hidden' }}>
      {children}
    </div>
  );
}

export const buttonModule = {
  kind: 'button',
  meta: buttonMeta,
  exportOrder: 10,
  writer: writeButton,
  createDefault: createDefaultButton,
  validate: validateButton,
} satisfies ObjectModule<'button'>;
