import type { ComponentType } from 'react';
import type { EditorObject, ObjectKind, ReferenceKind } from '../domain/types';
import { ButtonProperties } from './button';
import { ContainerProperties } from './container';
import { DataMaskProperties } from './data-mask';
import { FillAttributeProperties } from './fill-attribute';
import { FontAttributeProperties } from './font-attribute';
import { InputBooleanProperties } from './input-boolean';
import { InputStringProperties } from './input-string';
import { KeyProperties } from './key';
import { LineAttributeProperties } from './line-attribute';
import { NumberVariableProperties } from './number-variable';
import { OutputNumberProperties } from './output-number';
import { OutputRectangleProperties } from './output-rectangle';
import { OutputStringProperties } from './output-string';
import { PictureGraphicProperties } from './picture-graphic';
import { SoftKeyMaskProperties } from './soft-key-mask';
import { StringVariableProperties } from './string-variable';

export type ObjectPropertiesProps = {
  object: EditorObject;
  objects: EditorObject[];
  onPatch: (changes: Partial<EditorObject>) => void;
  onCreateAttributeReference: (kind: ReferenceKind) => void;
};

export const objectPropertyComponents = {
  'font-attribute': FontAttributeProperties,
  'line-attribute': LineAttributeProperties,
  'fill-attribute': FillAttributeProperties,
  'string-variable': StringVariableProperties,
  'number-variable': NumberVariableProperties,
  'output-string': OutputStringProperties,
  'output-number': OutputNumberProperties,
  'output-rectangle': OutputRectangleProperties,
  'picture-graphic': PictureGraphicProperties,
  'container': ContainerProperties,
  'button': ButtonProperties,
  'input-boolean': InputBooleanProperties,
  'input-string': InputStringProperties,
  'key': KeyProperties,
  'data-mask': DataMaskProperties,
  'soft-key-mask': SoftKeyMaskProperties,
} satisfies Record<ObjectKind, ComponentType<ObjectPropertiesProps>>;
