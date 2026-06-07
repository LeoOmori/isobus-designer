import { Type } from 'lucide-react';
import { vtFontCells } from '../../domain/isobus';
import type { EditorObject, ProjectState } from '../../domain/types';
import { fontSizeEnum } from '../../domain/export/encoding';
import { writeFontAttributes } from '../../domain/export/writers/fontAttributes';
import { createReferenceBase } from '../createHelpers';
import type { CreateObjectContext, ObjectLookup, ObjectMeta, ObjectModule } from '../ObjectModule';

export const fontAttributeMeta = {
  name: 'Font Attribute', Icon: Type, category: 'attribute', isReference: true, hasLayout: false,
} satisfies ObjectMeta;

export function createDefaultFontAttribute({ current }: CreateObjectContext): EditorObject {
  return {
    ...createReferenceBase('font-attribute', fontAttributeMeta.name, current),
    fontColor: 0,
    proportional: true,
    fontWidth: 16,
    fontHeight: 24,
    fontType: 1,
    fontStyle: 0,
    fontSize: 24,
  };
}

export function validateFontAttributeForExport(obj: EditorObject, _project: ProjectState, _lookup: ObjectLookup): string[] {
  const width = obj.fontWidth ?? 16;
  const height = obj.fontHeight ?? 24;
  if (fontSizeEnum(width, height) !== -1) return [];
  const valid = vtFontCells.map((cell) => cell.label).join(', ');
  return [`Export: Font Attribute ${obj.id} size ${width}×${height} is not a standard V1 cell size. Valid sizes: ${valid}`];
}

export const fontAttributeModule = {
  kind: 'font-attribute',
  meta: fontAttributeMeta,
  exportOrder: 0,
  writer: writeFontAttributes,
  createDefault: createDefaultFontAttribute,
  validateExport: validateFontAttributeForExport,
} satisfies ObjectModule<'font-attribute'>;
