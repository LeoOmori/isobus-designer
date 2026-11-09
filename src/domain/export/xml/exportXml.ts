import type { EditorObject, MacroCommand, MacroReference, ObjectKind, ProjectState } from '../../types';
import { asHorizontalJustification, asVerticalJustification, nearestVtColorIndex } from '../../isobus';
import { objectRegistry } from '../../../objects/registry';
import { SOFT_KEY_SLOT_SIZE } from '../../../objects/soft-key-mask/logic';
import { fontSizeEnum, parseLineArt } from '../encoding';
import { validateForExport } from '../exportValidation';
import { parseHexObjectId } from '../idResolver';
import { pictureGraphicToBmp } from './bmp';
import type { ZipEntry } from './zip';

/**
 * vt2iso (ISOAgLib) XML export.
 *
 * Produces `<project>.xml` + `<project>.vtp` + `images/*.bmp`, ready for
 * `vt2iso -o=<out> <project>.vtp`. Attribute names and enum spellings follow
 * ISOAgLib `tools/vt2iso/src/vt2iso-defines.cpp` (the parser), which is
 * looser than `doc/vt2iso.xsd`.
 */

export type XmlExportResult = {
  /** Files for the .zip archive. Empty if errors are present. */
  files: ZipEntry[];
  errors: string[];
};

type Attrs = Record<string, string | number | undefined>;

type XmlContext = {
  project: ProjectState;
  objectById: Map<string, EditorObject>;
  names: Map<string, string>;
  /** vt2iso object name for an editor id, or undefined for null / unknown (vt2iso defaults to NULL). */
  ref: (editorId: string | null | undefined) => string | undefined;
  errors: string[];
};

// ── vt2iso enum tables (order = ISO bit / value index) ────────────────────
const FONT_SIZES = ['6x8', '8x8', '8x12', '12x16', '16x16', '16x24', '24x32', '32x32', '32x48', '48x64', '64x64', '64x96', '96x128', '128x128', '128x192'];
const FONT_STYLE = ['bold', 'crossed', 'underlined', 'italic', 'inverted', 'flashinginverted', 'flashinghidden'];
const STRING_OPTIONS = ['transparent', 'autowrap', 'wraponhyphen'];
const NUMBER_OPTIONS = ['transparent', 'leadingzeros', 'blankzero', 'truncate'];
const INPUT_OPTIONS = ['enabled', 'liveediting'];
const BUTTON_OPTIONS = ['latchable', 'latched', 'suppressborder', 'transparentbackground', 'disabled', 'noborder'];
const METER_OPTIONS = ['arc', 'border', 'ticks', 'clockwise'];
const LINEAR_BAR_OPTIONS = ['border', 'targetline', 'ticks', 'nofill', 'horizontal', 'growpositive'];
const ARCHED_BAR_OPTIONS = ['border', 'targetline', 'notused', 'nofill', 'clockwise'];
const PICTURE_OPTIONS = ['transparent', 'flashing'];
const LINE_SUPPRESSION = ['top', 'right', 'bottom', 'left'];
const PRIORITY = ['high', 'medium', 'low', 'none'];
const H_JUSTIFICATION = ['left', 'middle', 'right'];
const V_JUSTIFICATION = ['top', 'middle', 'bottom'];
const ELLIPSE_TYPES = ['closed', 'open', 'closedsegment', 'closedsection'];
const POLYGON_TYPES = ['convex', 'nonconvex', 'complex', 'open'];
const FILL_TYPES = ['nofill', 'linecolour', 'fillcolour', 'pattern'];
const NUMBER_FORMATS = ['fixed', 'exponential'];
const PICTURE_FORMATS = ['1bit', '4bit', '8bit'];
const LINE_DIRECTIONS = ['toplefttobottomright', 'bottomlefttotopright'];

/** Bitfield → "a+b", or "none". */
function options(value: number | undefined, table: string[]): string {
  const set = table.filter((name, bit) => name !== 'notused' && ((value ?? 0) >> bit) & 1);
  return set.length > 0 ? set.join('+') : 'none';
}

const yesNo = (v: boolean | undefined) => (v ? 'yes' : 'no');

function textAttrs(obj: EditorObject): Attrs {
  return {
    horizontal_justification: H_JUSTIFICATION[asHorizontalJustification(obj.horizontalJustification)],
    vertical_justification: V_JUSTIFICATION[asVerticalJustification(obj.verticalJustification)],
  };
}

function numberAttrs(obj: EditorObject, ctx: XmlContext): Attrs {
  return {
    width: obj.width,
    height: obj.height,
    background_colour: obj.backgroundColorIndex ?? 1,
    font_attributes: ctx.ref(obj.fontAttributeId),
    options: options((obj.outputOptions ?? 0) & 0x0f, NUMBER_OPTIONS),
    variable_reference: ctx.ref(obj.variableReference),
    value: obj.value ?? 0,
    offset: obj.offset ?? 0,
    scale: obj.scale ?? 1,
    number_of_decimals: obj.numberOfDecimals ?? 0,
    format: NUMBER_FORMATS[obj.numberFormat ?? 0],
    ...textAttrs(obj),
  };
}

function inputOptions(obj: EditorObject): string {
  return options(((obj.inputEnabled ?? true) ? 1 : 0) | (obj.realTimeEditing ? 2 : 0), INPUT_OPTIONS);
}

/** One entry per ObjectKind: a new kind fails `tsc` until it has an XML mapping. */
const XML_OBJECTS: Record<ObjectKind, { tag: string; attrs: (obj: EditorObject, ctx: XmlContext) => Attrs }> = {
  'data-mask': { tag: 'datamask', attrs: (o, ctx) => ({ background_colour: o.backgroundColorIndex ?? 1, soft_key_mask: ctx.ref(o.softKeyMaskId) }) },
  'alarm-mask': {
    tag: 'alarmmask',
    attrs: (o, ctx) => ({
      background_colour: o.backgroundColorIndex ?? 1,
      soft_key_mask: ctx.ref(o.alarmSoftKeyMaskId),
      priority: PRIORITY[o.priority ?? 1],
      acoustic_signal: PRIORITY[o.acousticSignal ?? 3],
    }),
  },
  'container': { tag: 'container', attrs: (o) => ({ width: o.width, height: o.height, hidden: yesNo(o.hidden) }) },
  'soft-key-mask': { tag: 'softkeymask', attrs: (o) => ({ background_colour: o.backgroundColorIndex ?? 1 }) },
  'key': { tag: 'key', attrs: (o) => ({ background_colour: o.backgroundColorIndex ?? 1, key_code: o.keyCode ?? 1 }) },
  'button': {
    tag: 'button',
    attrs: (o) => ({
      width: o.width,
      height: o.height,
      background_colour: o.backgroundColorIndex ?? 1,
      border_colour: o.borderColorIndex ?? 0,
      key_code: o.keyCode ?? 0,
      options: options(o.buttonOptions, BUTTON_OPTIONS),
    }),
  },
  'input-boolean': {
    tag: 'inputboolean',
    attrs: (o, ctx) => ({
      background_colour: o.backgroundColorIndex ?? 1,
      width: o.width,
      foreground_colour: ctx.ref(o.fontAttributeId),
      variable_reference: ctx.ref(o.variableReference),
      value: (o.value ?? 0) > 0 ? 'true' : 'false',
      enabled: yesNo(o.inputEnabled ?? true),
    }),
  },
  'input-string': {
    tag: 'inputstring',
    attrs: (o, ctx) => ({
      width: o.width,
      height: o.height,
      background_colour: o.backgroundColorIndex ?? 1,
      font_attributes: ctx.ref(o.fontAttributeId),
      options: options((o.outputOptions ?? 0) & 0x07, STRING_OPTIONS),
      variable_reference: ctx.ref(o.variableReference),
      ...textAttrs(o),
      length: Math.min(o.length ?? 16, 255),
      value: o.text ?? '',
      enabled: yesNo(o.inputEnabled ?? true),
    }),
  },
  'input-number': {
    tag: 'inputnumber',
    attrs: (o, ctx) => ({ ...numberAttrs(o, ctx), min_value: o.minValue ?? 0, max_value: o.maxValue ?? 0xffffffff, inputobject_options: inputOptions(o) }),
  },
  'input-list': {
    tag: 'inputlist',
    attrs: (o, ctx) => ({
      width: o.width,
      height: o.height,
      variable_reference: ctx.ref(o.variableReference),
      value: o.value ?? 255,
      number_of_items: (o.listItems ?? []).length,
      options: inputOptions(o),
    }),
  },
  'output-string': {
    tag: 'outputstring',
    attrs: (o, ctx) => ({
      width: o.width,
      height: o.height,
      background_colour: o.backgroundColorIndex ?? 1,
      font_attributes: ctx.ref(o.fontAttributeId),
      options: options(o.outputOptions, STRING_OPTIONS),
      variable_reference: ctx.ref(o.variableReference),
      ...textAttrs(o),
      length: o.length ?? 32,
      value: o.text ?? '',
    }),
  },
  'output-number': { tag: 'outputnumber', attrs: numberAttrs },
  'output-line': {
    tag: 'line',
    attrs: (o, ctx) => ({ line_attributes: ctx.ref(o.lineAttributeId), width: o.width, height: o.height, line_direction: LINE_DIRECTIONS[o.lineDirection ?? 0] }),
  },
  'output-rectangle': {
    tag: 'rectangle',
    attrs: (o, ctx) => ({
      line_attributes: ctx.ref(o.lineAttributeId),
      width: o.width,
      height: o.height,
      line_suppression: options(o.lineSuppression, LINE_SUPPRESSION),
      fill_attributes: ctx.ref(o.fillAttributeId),
    }),
  },
  'output-ellipse': {
    tag: 'ellipse',
    attrs: (o, ctx) => ({
      line_attributes: ctx.ref(o.lineAttributeId),
      width: o.width,
      height: o.height,
      ellipse_type: ELLIPSE_TYPES[o.ellipseType ?? 0],
      start_angle: o.startAngle ?? 0,
      end_angle: o.endAngle ?? 0,
      fill_attributes: ctx.ref(o.fillAttributeId),
    }),
  },
  'output-polygon': {
    tag: 'polygon',
    attrs: (o, ctx) => ({
      width: o.width,
      height: o.height,
      line_attributes: ctx.ref(o.lineAttributeId),
      fill_attributes: ctx.ref(o.fillAttributeId),
      polygon_type: POLYGON_TYPES[o.polygonType ?? 2],
    }),
  },
  'output-meter': {
    tag: 'meter',
    attrs: (o, ctx) => ({
      width: o.width,
      needle_colour: o.needleColor ?? 0,
      border_colour: o.borderColorIndex ?? 0,
      arc_and_tick_colour: o.arcAndTickColor ?? 0,
      options: options(o.meterOptions, METER_OPTIONS),
      number_of_ticks: o.numberOfTicks ?? 5,
      start_angle: o.startAngle ?? 110,
      end_angle: o.endAngle ?? 35,
      min_value: o.minValue ?? 0,
      max_value: o.maxValue ?? 0,
      variable_reference: ctx.ref(o.variableReference),
      value: o.value ?? 0,
    }),
  },
  'output-linear-bar-graph': {
    tag: 'linearbargraph',
    attrs: (o, ctx) => ({
      width: o.width,
      height: o.height,
      colour: o.backgroundColorIndex ?? 2,
      target_line_colour: o.targetLineColor ?? 0,
      options: options(o.linearBarOptions ?? 1, LINEAR_BAR_OPTIONS),
      number_of_ticks: o.numberOfTicks ?? 0,
      min_value: o.minValue ?? 0,
      max_value: o.maxValue ?? 100,
      variable_reference: ctx.ref(o.variableReference),
      value: o.value ?? 0,
      target_value_variable_reference: ctx.ref(o.targetValueVariableReference),
      target_value: o.targetValue ?? 0,
    }),
  },
  'output-arched-bar-graph': {
    tag: 'archedbargraph',
    attrs: (o, ctx) => ({
      width: o.width,
      height: o.height,
      colour: o.backgroundColorIndex ?? 2,
      target_line_colour: o.targetLineColor ?? 4,
      options: options(o.archedBarOptions ?? 3, ARCHED_BAR_OPTIONS),
      start_angle: o.arcStartAngle ?? 45,
      end_angle: o.arcEndAngle ?? 135,
      bar_graph_width: o.barGraphWidth ?? 12,
      min_value: o.minValue ?? 0,
      max_value: o.maxValue ?? 100,
      variable_reference: ctx.ref(o.variableReference),
      value: o.value ?? 0,
      target_value_variable_reference: ctx.ref(o.targetValueVariableReference),
      target_value: o.targetValue ?? 0,
    }),
  },
  'picture-graphic': {
    tag: 'picturegraphic',
    attrs: (o, ctx) => ({
      width: o.targetWidth ?? o.width,
      actual_width: o.actualWidth ?? o.width,
      actual_height: o.actualHeight ?? o.height,
      format: PICTURE_FORMATS[o.graphicFormat ?? 2],
      options: options(o.graphicOptions, PICTURE_OPTIONS),
      transparency_colour: o.transparencyColor ?? 0,
      file: pictureFileName(ctx.names.get(o.id)!),
    }),
  },
  'number-variable': { tag: 'numbervariable', attrs: (o) => ({ value: o.value ?? 0 }) },
  'string-variable': { tag: 'stringvariable', attrs: (o) => ({ value: o.stringValue ?? '' }) },
  'font-attribute': {
    tag: 'fontattributes',
    attrs: (o) => ({
      font_colour: o.fontColor ?? 0,
      // Same enum index the .iop writer emits, spelled as vt2iso's ISO size name.
      font_size: FONT_SIZES[Math.max(0, fontSizeEnum(o.fontWidth ?? 16, o.fontHeight ?? 24))],
      font_type: o.fontType ?? 0,
      font_style: options(o.fontStyle, FONT_STYLE),
    }),
  },
  'line-attribute': {
    tag: 'lineattributes',
    attrs: (o) => ({ line_colour: o.lineColor ?? 0, line_width: o.lineWidth ?? 1, line_art: parseLineArt(o.lineArt).toString(2).padStart(16, '0') }),
  },
  'fill-attribute': {
    tag: 'fillattributes',
    attrs: (o, ctx) => ({ fill_type: FILL_TYPES[o.fillType ?? 0], fill_colour: o.fillColor ?? 0, fill_pattern: ctx.ref(o.fillPattern) }),
  },
  'object-pointer': { tag: 'objectpointer', attrs: (o, ctx) => ({ value: ctx.ref(o.pointerValue) }) },
  'macro': { tag: 'macro', attrs: (o) => ({ number_of_bytes: (o.macroCommands ?? []).length * 8 }) },
};

// vt2iso looks pictures up in the .vtp <Bitmaps> paths, so `file` is just the name inside IMAGES_DIR.
const IMAGES_DIR = 'images';
const pictureFileName = (name: string) => `${name}.bmp`;

// ── XML text helpers ──────────────────────────────────────────────────────
function escapeXml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/\n/g, '&#10;');
}

function element(indent: string, tag: string, attrs: Attrs, children: string[] = []): string {
  const attrText = Object.entries(attrs)
    .filter(([, v]) => v !== undefined)
    .map(([k, v]) => ` ${k}="${escapeXml(String(v))}"`)
    .join('');
  if (children.length === 0) return `${indent}<${tag}${attrText}/>`;
  return [`${indent}<${tag}${attrText}>`, ...children, `${indent}</${tag}>`].join('\n');
}

/** Editor names → unique C identifiers (vt2iso turns them into `iVtObject<name>`). */
export function buildXmlNames(project: ProjectState): Map<string, string> {
  const names = new Map<string, string>();
  const used = new Set<string>();
  const entries: Array<[string, string, string]> = [
    [project.workingSet.id, project.workingSet.name, 'workingSet'],
    ...project.objects.map((o): [string, string, string] => [o.id, o.name, `${XML_OBJECTS[o.kind].tag}${parseInt(o.objectId.replace(/^0x/i, ''), 16)}`]),
  ];
  for (const [id, name, fallback] of entries) {
    let base = (name ?? '').replace(/[^A-Za-z0-9_]+/g, '_').replace(/^_+|_+$/g, '');
    if (!base) base = fallback;
    if (/^[0-9]/.test(base)) base = `o${base}`;
    let unique = base;
    for (let n = 2; used.has(unique); n += 1) unique = `${base}_${n}`;
    used.add(unique);
    names.set(id, unique);
  }
  return names;
}

function objectIdOf(obj: EditorObject): number {
  return parseHexObjectId(obj.objectId);
}

function macroElements(owner: EditorObject, ctx: XmlContext, indent: string): string[] {
  return (owner.macros ?? []).map((m: MacroReference) =>
    element(indent, 'include_macro', { event: m.eventId, name: m.macroEditorId ? ctx.ref(m.macroEditorId) : m.macroId }),
  );
}

function commandElement(cmd: MacroCommand, ctx: XmlContext, owner: EditorObject, indent: string): string | null {
  switch (cmd.kind) {
    case 'hideShowObject':
      return element(indent, 'command_hide_show_object', { object_id: ctx.ref(cmd.objectEditorId), hide_show: cmd.showObject ? 'show' : 'hide' });
    case 'changeNumericValue':
      return element(indent, 'command_change_numeric_value', { object_id: ctx.ref(cmd.objectEditorId), new_value: cmd.numericValue ?? 0 });
    case 'changeBackgroundColor':
      return element(indent, 'command_change_background_colour', { object_id: ctx.ref(cmd.objectEditorId), new_background_colour: cmd.colorIndex ?? 0 });
    case 'changeActiveMask':
      return element(indent, 'command_change_active_mask', {
        working_set_object_id: ctx.ref(ctx.project.workingSet.id),
        new_active_mask_object_id: ctx.ref(cmd.maskEditorId),
      });
    case 'changeAttribute':
      return element(indent, 'command_change_attribute', { object_id: ctx.ref(cmd.objectEditorId), attribute_id: cmd.attributeId ?? 0, new_value: cmd.attributeValue ?? 0 });
    default:
      ctx.errors.push(`XML export: Macro ${owner.id} has unsupported command "${(cmd as MacroCommand).kind}"`);
      return null;
  }
}

function sortedChildren(ids: string[] | undefined, ctx: XmlContext): EditorObject[] {
  return (ids ?? [])
    .map((id) => ctx.objectById.get(id))
    .filter((c): c is EditorObject => c !== undefined)
    .sort((a, b) => a.zIndex - b.zIndex);
}

/** Write an object once; later references to it become `<include_object>`. */
function writeObject(obj: EditorObject, ctx: XmlContext, emitted: Set<string>, indent: string, pos?: { x: number; y: number }): string {
  const name = ctx.names.get(obj.id)!;
  const posAttrs: Attrs = pos ? { pos_x: pos.x, pos_y: pos.y } : {};
  if (emitted.has(obj.id)) return element(indent, 'include_object', { name, ...posAttrs });
  emitted.add(obj.id);

  const inner = `${indent}  `;
  const children: string[] = [];
  switch (obj.kind) {
    case 'data-mask':
    case 'alarm-mask':
    case 'container':
    case 'button':
    case 'key':
      for (const child of sortedChildren(obj.childObjectIds, ctx)) {
        children.push(writeObject(child, ctx, emitted, inner, { x: child.x, y: child.y }));
      }
      break;
    case 'soft-key-mask':
      for (const keyId of obj.keys ?? []) {
        const key = ctx.objectById.get(keyId);
        if (key) children.push(writeObject(key, ctx, emitted, inner));
      }
      break;
    case 'input-list': {
      const items = obj.listItems ?? [];
      // vt2iso pads missing items with NULL only at the end of the list.
      const lastItem = items.reduce((last, id, i) => (id ? i : last), -1);
      items.forEach((itemId, i) => {
        const item = itemId ? ctx.objectById.get(itemId) : undefined;
        if (item) children.push(writeObject(item, ctx, emitted, inner));
        else if (i < lastItem) ctx.errors.push(`XML export: Input List ${obj.id} item ${i} is empty; vt2iso only allows empty items at the end of the list`);
      });
      break;
    }
    case 'output-polygon':
      for (const p of obj.polygonPoints ?? []) children.push(element(inner, 'point', { pos_x: p.x, pos_y: p.y }));
      break;
    case 'macro':
      for (const cmd of obj.macroCommands ?? []) {
        const command = commandElement(cmd, ctx, obj, inner);
        if (command) children.push(command);
      }
      break;
  }
  children.push(...macroElements(obj, ctx, inner));

  const objectId = objectIdOf(obj);
  // vt2iso macro ids are 0–255; let it allocate larger ones.
  const id = obj.kind === 'macro' && objectId > 255 ? undefined : objectId;
  return element(indent, XML_OBJECTS[obj.kind].tag, { id, name, ...posAttrs, ...XML_OBJECTS[obj.kind].attrs(obj, ctx) }, children);
}

/** vt2iso-only rules on top of validateForExport (which already checks fonts, pictures, ids). */
function validateForXml(project: ProjectState): string[] {
  const errors: string[] = [];
  for (const obj of project.objects) {
    if (obj.kind !== 'button' && obj.kind !== 'key') continue;
    const keyCode = obj.keyCode ?? (obj.kind === 'key' ? 1 : 0);
    if (keyCode < 1 || keyCode > 255) errors.push(`XML export: ${obj.id} key code ${keyCode} must be 1–255 for vt2iso`);
  }
  return errors;
}

/** Export the project as a vt2iso project: `<name>.xml`, `<name>.vtp` and `images/*.bmp`. */
export function exportXml(project: ProjectState): XmlExportResult {
  const preErrors = [...validateForExport(project), ...validateForXml(project)];
  if (preErrors.length > 0) return { files: [], errors: preErrors };

  const names = buildXmlNames(project);
  const objectById = new Map(project.objects.map((o) => [o.id, o]));
  const ctx: XmlContext = {
    project,
    objectById,
    names,
    ref: (id) => (id ? names.get(id) : undefined),
    errors: [],
  };
  const emitted = new Set<string>();
  const ws = project.workingSet;

  const wsChildren = (ws.designatorObjects ?? []).flatMap((d) => {
    const obj = objectById.get(d.objectId);
    return obj ? [writeObject(obj, ctx, emitted, '    ', { x: d.x, y: d.y })] : [];
  });
  const lines = [
    element('  ', 'workingset', {
      id: 0,
      name: names.get(ws.id),
      background_colour: nearestVtColorIndex(ws.backgroundColor ?? '#ffffff'),
      selectable: yesNo(ws.selectable),
      active_mask: ctx.ref(ws.activeDataMaskId),
    }, wsChildren),
  ];

  // Roots first (masks, soft key masks, ...), so children nest under their first parent;
  // reference objects (attributes, variables, macros) go last, at the top level as vt2iso requires.
  const childIds = new Set(project.objects.flatMap((o) => [...(o.childObjectIds ?? []), ...(o.keys ?? []), ...(o.listItems ?? [])]));
  const isReference = (o: EditorObject) => objectRegistry[o.kind].meta.isReference || o.kind === 'macro';
  const roots = project.objects.filter((o) => !childIds.has(o.id));
  for (const obj of [...roots.filter((o) => !isReference(o)), ...roots.filter(isReference), ...project.objects]) {
    if (!emitted.has(obj.id)) lines.push(writeObject(obj, ctx, emitted, '  '));
  }

  if (ctx.errors.length > 0) return { files: [], errors: ctx.errors };

  const projectName = names.get(ws.id)!;
  const xml = ['<?xml version="1.0" encoding="UTF-8"?>', '<objectpool>', ...lines, '</objectpool>', ''].join('\n');
  const firstMask = project.objects.find((o) => o.kind === 'data-mask');
  const vtp = [
    '<?xml version="1.0" encoding="UTF-8"?>',
    `<!-- vt2iso -o=<output dir> ${projectName}.vtp -->`,
    '<Project>',
    `  <Meta ProjectName="${projectName}"/>`,
    `  <iso11783 version="${ws.vtVersion ?? 3}"/>`,
    `  <ObjectPoolSettings dimension="${firstMask?.width ?? 480}" softkeywidth="${SOFT_KEY_SLOT_SIZE}" softkeyheight="${SOFT_KEY_SLOT_SIZE}"/>`,
    '  <Files>',
    `    <File FilePath="${projectName}.xml" RelativePath="1"/>`,
    '  </Files>',
    '  <Bitmaps>',
    `    <Bitmap Path="${IMAGES_DIR}" RelativePath="1"/>`,
    '  </Bitmaps>',
    '</Project>',
    '',
  ].join('\n');

  const encoder = new TextEncoder();
  const files: ZipEntry[] = [
    { path: `${projectName}.xml`, data: encoder.encode(xml) },
    { path: `${projectName}.vtp`, data: encoder.encode(vtp) },
    ...project.objects
      .filter((o) => o.kind === 'picture-graphic')
      .map((o) => ({ path: `${IMAGES_DIR}/${pictureFileName(names.get(o.id)!)}`, data: pictureGraphicToBmp(o) })),
  ];
  return { files, errors: [] };
}
