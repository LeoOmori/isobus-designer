import type { ComponentType } from 'react';
import type { EditorObject, ObjectKind, ReferenceKind } from '../domain/types';
import { FillAttributeProperties } from './fill-attribute';
import { FontAttributeProperties } from './font-attribute';
import { LineAttributeProperties } from './line-attribute';
import { NumberVariableProperties } from './number-variable';
import { OutputNumberProperties } from './output-number';
import { OutputRectangleProperties } from './output-rectangle';
import { PictureGraphicProperties } from './picture-graphic';
import { StringVariableProperties } from './string-variable';

export type ObjectPropertiesProps = {
  object: EditorObject;
  objects: EditorObject[];
  onPatch: (changes: Partial<EditorObject>) => void;
  onCreateAttributeReference: (kind: ReferenceKind) => void;
};

export const referencePropertyComponents: Partial<Record<ObjectKind, ComponentType<ObjectPropertiesProps>>> = {
  'font-attribute': FontAttributeProperties,
  'line-attribute': LineAttributeProperties,
  'fill-attribute': FillAttributeProperties,
  'string-variable': StringVariableProperties,
  'number-variable': NumberVariableProperties,
  'output-number': OutputNumberProperties,
  'output-rectangle': OutputRectangleProperties,
  'picture-graphic': PictureGraphicProperties,
};
