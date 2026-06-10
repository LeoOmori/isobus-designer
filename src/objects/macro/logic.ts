import { Zap } from 'lucide-react';
import type { EditorObject, ProjectState } from '../../domain/types';
import { writeMacro } from '../../domain/export/writers/macro';
import { createReferenceBase } from '../createHelpers';
import type { CreateObjectContext, ObjectLookup, ObjectMeta, ObjectModule } from '../ObjectModule';

export const macroMeta = {
  name: 'Macro', Icon: Zap, category: 'automation', isReference: false, hasLayout: false,
} satisfies ObjectMeta;

export function createDefaultMacro({ current }: CreateObjectContext): EditorObject {
  return {
    ...createReferenceBase('macro', macroMeta.name, current),
    macroCommands: [],
  };
}

export function validateMacro(obj: EditorObject, _project: ProjectState, _lookup: ObjectLookup): string[] {
  const errors: string[] = [];

  // Validate each command
  for (let i = 0; i < (obj.macroCommands ?? []).length; i++) {
    const cmd = obj.macroCommands![i];
    const prefix = `Macro ${obj.id} command ${i + 1} (${cmd.kind})`;

    switch (cmd.kind) {
      case 'hideShowObject':
        if (!cmd.objectEditorId) errors.push(`${prefix}: target object is required`);
        break;
      case 'changeNumericValue':
        if (!cmd.objectEditorId) errors.push(`${prefix}: target object is required`);
        if (cmd.numericValue === undefined) errors.push(`${prefix}: value is required`);
        break;
      case 'changeBackgroundColor':
        if (!cmd.objectEditorId) errors.push(`${prefix}: target object is required`);
        if (cmd.colorIndex === undefined || cmd.colorIndex < 0 || cmd.colorIndex > 255) {
          errors.push(`${prefix}: colorIndex must be 0–255`);
        }
        break;
      case 'changeActiveMask':
        if (!cmd.maskEditorId) errors.push(`${prefix}: target mask is required`);
        break;
      case 'changeAttribute':
        if (!cmd.objectEditorId) errors.push(`${prefix}: target object is required`);
        if (cmd.attributeId === undefined || cmd.attributeId < 0 || cmd.attributeId > 255) {
          errors.push(`${prefix}: attributeId must be 0–255`);
        }
        break;
    }
  }

  return errors;
}

export const macroModule = {
  kind: 'macro',
  meta: macroMeta,
  exportOrder: 2,
  writer: writeMacro,
  createDefault: createDefaultMacro,
  validate: validateMacro,
} satisfies ObjectModule<'macro'>;
