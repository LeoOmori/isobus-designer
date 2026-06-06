export type MacroReference = {
  eventId: number;
  macroId: number;
};

export type ObjectKind =
  | 'data-mask'
  | 'soft-key-mask'
  | 'key'
  | 'button'
  | 'output-string'
  | 'output-number'
  | 'output-rectangle'
  | 'picture-graphic'
  | 'font-attribute'
  | 'line-attribute'
  | 'fill-attribute'
  | 'string-variable'
  | 'number-variable';

export type ToolMode =
  | 'select'
  | 'pan'
  | 'data-mask'
  | 'output-string'
  | 'output-rectangle'
  | 'button'
  | 'output-number'
  | 'picture-graphic';

export type ReferenceKind =
  | 'line-attribute'
  | 'fill-attribute'
  | 'font-attribute'
  | 'string-variable'
  | 'number-variable';

export type EditorObject = {
  // ── Core ────────────────────────────────────────────────────────────
  id: string;
  objectId: string;
  name: string;
  kind: ObjectKind;
  parentId?: string;
  visible: boolean;
  locked?: boolean;
  notes?: string;
  zIndex: number;

  // ── Layout ──────────────────────────────────────────────────────────
  x: number;
  y: number;
  width: number;
  height: number;

  // ── Editor display colors (CSS hex) ─────────────────────────────────
  backgroundColor: string;
  backgroundColorIndex?: number; // uint8 VT palette index, used by spec-backed objects
  borderColor: string;
  borderColorIndex?: number;     // uint8 VT palette index, used by spec-backed objects

  // ── Shared: container + macros ───────────────────────────────────────
  childObjectIds?: string[];    // Data Mask, Key, Button children
  macros?: MacroReference[];

  // ── Data Mask (objectType 1) ─────────────────────────────────────────
  softKeyMaskId?: string;
  nextMaskId?: string;
  previousMaskId?: string;

  // ── Soft Key Mask (objectType 4) ─────────────────────────────────────
  keys?: string[];              // Key objectId references (ordered)
  layoutPreview?: 'vertical' | 'horizontal';
  softKeyCountPreview?: number;

  // ── Key (objectType 5) ───────────────────────────────────────────────
  icon?: string;                // Picture Graphic objectId
  actionName?: string;
  label?: string;

  // ── Button (objectType 6) ────────────────────────────────────────────
  keyCode?: number;             // uint8
  buttonOptions?: number;       // uint8 bitfield (see BUTTON_OPTION_* constants)

  // ── Output String (objectType 11) ────────────────────────────────────
  text?: string;
  length?: number;               // uint16 fixed value byte length
  fontAttributeId?: string;
  variableReference?: string | null; // null = 0xFFFF NULL/use local value; string/number variable id by object kind
  stringVariableId?: string;     // legacy: migrated to variableReference
  outputOptions?: number;        // uint8 (bit0=transparent, bit1=auto-wrap, bit2=wrap-on-hyphen)
  horizontalJustification?: 0 | 1 | 2;
  verticalJustification?: 0 | 1 | 2;
  horizontalAlign?: 'left' | 'center' | 'right'; // legacy: migrated to horizontalJustification
  verticalAlign?: 'top' | 'center' | 'bottom';   // legacy: migrated to verticalJustification

  // ── Output Number (objectType 12) ────────────────────────────────────
  numberVariableId?: string;      // legacy: migrated to variableReference
  offset?: number;              // int32
  scale?: number;               // float
  numberOfDecimals?: number;    // uint8
  numberFormat?: number;        // uint8 (0=fixed decimal, 1=exponential)
  value?: number;               // uint32 — also used by Number Variable

  // ── Output Rectangle (objectType 14) ─────────────────────────────────
  lineAttributeId?: string;
  fillAttributeId?: string | null;   // null = 0xFFFF NULL = no fill
  lineSuppression?: number;     // uint8 bitmask – hide sides

  // ── Picture Graphic (objectType 20) ──────────────────────────────────
  targetWidth?: number;         // uint16 — VT stores target width only; target height is derived from aspect ratio
  actualWidth?: number;         // uint16 — original bitmap width
  actualHeight?: number;        // uint16 — original bitmap height
  graphicFormat?: 0 | 1 | 2;    // uint8: 0=mono, 1=4-bit color, 2=8-bit color
  graphicOptions?: number;      // uint8 bitfield: bit0=transparent, bit1=flashing, bit2=RLE
  transparencyColor?: number;   // uint8 palette index
  rawData?: number[];           // packed palette-indexed pixel bytes
  sourceImagePath?: string;
  sourceImageDataUrl?: string;  // editor-only original upload for re-quantizing format/options

  // ── Font Attribute (objectType 23) ───────────────────────────────────
  fontColor?: number;           // uint8 VT palette index
  fontType?: number;            // uint8
  fontStyle?: number;           // uint8 bitfield (1=bold, 2=italic, 4=underline)
  proportional?: boolean;
  fontWidth?: number;
  fontHeight?: number;
  fontSize?: number;            // CSS helper for rendering

  // ── Line Attribute (objectType 24) ───────────────────────────────────
  lineColor?: number;           // uint8 VT palette index
  lineWidth?: number;           // uint8
  lineArt?: string;             // uint16 hex string (0xFFFF=solid)

  // ── Fill Attribute (objectType 25) ───────────────────────────────────
  fillType?: number;            // uint8: 0=no fill, 1=line color, 2=fill color, 3=pattern
  fillColor?: number;           // uint8 VT palette index
  fillPattern?: string;         // Picture Graphic objectId (for fillType=3)

  // ── String Variable (objectType 22) ──────────────────────────────────
  stringValue?: string;
  maxLength?: number;

  // ── Number Variable (objectType 21) ──────────────────────────────────
  // value (uint32) shared with Output Number above
  unit?: string;
  minPreview?: number;
  maxPreview?: number;

  // ── Editor-only helpers ───────────────────────────────────────────────
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
  selectable?: boolean;
  description?: string;
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
