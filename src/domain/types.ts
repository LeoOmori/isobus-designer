export type ObjectKind =
  | 'data-mask'
  | 'output-string'
  | 'rectangle'
  | 'line-attribute'
  | 'fill-attribute'
  | 'font-attribute'
  | 'string-variable';

export type ToolMode = 'select' | 'pan' | 'data-mask' | 'output-string' | 'rectangle';

export type ReferenceKind = 'line-attribute' | 'fill-attribute' | 'font-attribute' | 'string-variable';

export type EditorObject = {
  id: string;
  objectId: string;
  name: string;
  kind: ObjectKind;
  parentId?: string;
  x: number;
  y: number;
  width: number;
  height: number;
  backgroundColor: string;
  borderColor: string;
  text?: string;
  fontSize?: number;
  visible: boolean;
  hidden?: boolean;
  locked?: boolean;
  childObjectIds?: string[];
  softKeyMaskId?: string;
  nextMaskId?: string;
  previousMaskId?: string;
  lineAttributeId?: string;
  fillAttributeId?: string;
  lineColor?: number;
  lineWidth?: number;
  lineArt?: string;
  fillType?: 'solid' | 'hollow' | 'horizontal' | 'vertical' | 'cross-hatch';
  fillColor?: number;
  fontAttributeId?: string;
  stringVariableId?: string;
  horizontalAlign?: 'left' | 'center' | 'right';
  verticalAlign?: 'top' | 'center' | 'bottom';
  fontColor?: number;
  fontType?: number;
  fontStyle?: number;
  proportional?: boolean;
  fontWidth?: number;
  fontHeight?: number;
  stringValue?: string;
  zIndex: number;
};

export type WorkingSet = {
  id: 'WS_1';
  objectId: string;
  name: string;
  version: string;
  language: string;
  activeDataMaskId: string;
  activeSoftKeyMaskId: string;
  backgroundColor: string;
  visible: boolean;
};

export type ProjectState = {
  workingSet: WorkingSet;
  objects: EditorObject[];
  activeMaskId: string;
  nextNumber: number;
};

export type Viewport = { x: number; y: number; zoom: number };

export type DragState =
  | { type: 'pan'; startX: number; startY: number; startView: Viewport }
  | { type: 'move'; objectId: string; startX: number; startY: number; startObject: EditorObject }
  | { type: 'resize'; objectId: string; startX: number; startY: number; startObject: EditorObject };
