import type { ComponentType } from 'react';
import type { EditorObject, ObjectKind, ProjectState, ReferenceKind } from '../domain/types';
import type { WriteContext } from '../domain/export/context';

export type ObjectMeta = {
  name: string;
  Icon: ComponentType<{ size?: number }>;
  category: 'screen' | 'group' | 'output' | 'input' | 'attribute' | 'variable';
  isReference: boolean;
  hasLayout: boolean;
};

export type ObjectLookup = {
  objectById: Map<string, EditorObject>;
};

export type CreateObjectContext = {
  current: ProjectState;
  x: number;
  y: number;
  parentId: string;
};

export type ObjectModule<K extends ObjectKind = ObjectKind> = {
  kind: K;
  meta: ObjectMeta;
  exportOrder: number;
  writer: (obj: EditorObject, ctx: WriteContext) => void;
  createDefault?: (ctx: CreateObjectContext) => EditorObject;
  migrate?: (object: EditorObject) => EditorObject;
  validate?: (object: EditorObject, project: ProjectState, lookup: ObjectLookup) => string[];
  validateExport?: (object: EditorObject, project: ProjectState, lookup: ObjectLookup) => string[];
  Properties?: ComponentType<{
    object: EditorObject;
    objects: EditorObject[];
    onPatch: (changes: Partial<EditorObject>) => void;
    onCreateAttributeReference: (kind: ReferenceKind) => void;
  }>;
};
