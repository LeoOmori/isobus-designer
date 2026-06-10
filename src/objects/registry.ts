import type { ObjectKind, ReferenceKind } from '../domain/types';
import type { ObjectModule } from './ObjectModule';
import { alarmMaskModule } from './alarm-mask/logic';
import { AlarmMaskProperties } from './alarm-mask';
import { buttonModule } from './button/logic';
import { ButtonProperties } from './button';
import { containerModule } from './container/logic';
import { ContainerProperties } from './container';
import { dataMaskModule } from './data-mask/logic';
import { DataMaskProperties } from './data-mask';
import { fillAttributeModule } from './fill-attribute/logic';
import { FillAttributeProperties } from './fill-attribute';
import { fontAttributeModule } from './font-attribute/logic';
import { FontAttributeProperties } from './font-attribute';
import { inputBooleanModule } from './input-boolean/logic';
import { InputBooleanProperties } from './input-boolean';
import { inputListModule } from './input-list/logic';
import { InputListProperties } from './input-list';
import { inputNumberModule } from './input-number/logic';
import { InputNumberProperties } from './input-number';
import { inputStringModule } from './input-string/logic';
import { InputStringProperties } from './input-string';
import { keyModule } from './key/logic';
import { KeyProperties } from './key';
import { lineAttributeModule } from './line-attribute/logic';
import { LineAttributeProperties } from './line-attribute';
import { numberVariableModule } from './number-variable/logic';
import { NumberVariableProperties } from './number-variable';
import { objectPointerModule } from './object-pointer/logic';
import { ObjectPointerProperties } from './object-pointer';
import { outputArchedBarGraphModule } from './output-arched-bar-graph/logic';
import { OutputArchedBarGraphProperties } from './output-arched-bar-graph';
import { outputEllipseModule } from './output-ellipse/logic';
import { OutputEllipseProperties } from './output-ellipse';
import { outputLineModule } from './output-line/logic';
import { OutputLineProperties } from './output-line';
import { outputLinearBarGraphModule } from './output-linear-bar-graph/logic';
import { OutputLinearBarGraphProperties } from './output-linear-bar-graph';
import { outputMeterModule } from './output-meter/logic';
import { OutputMeterProperties } from './output-meter';
import { outputNumberModule } from './output-number/logic';
import { OutputNumberProperties } from './output-number';
import { outputPolygonModule } from './output-polygon/logic';
import { OutputPolygonProperties } from './output-polygon';
import { outputRectangleModule } from './output-rectangle/logic';
import { OutputRectangleProperties } from './output-rectangle';
import { outputStringModule } from './output-string/module';
import { OutputStringProperties } from './output-string';
import { pictureGraphicModule } from './picture-graphic/logic';
import { PictureGraphicProperties } from './picture-graphic';
import { softKeyMaskModule } from './soft-key-mask/logic';
import { SoftKeyMaskProperties } from './soft-key-mask';
import { stringVariableModule } from './string-variable/logic';
import { StringVariableProperties } from './string-variable';
import { macroModule } from './macro/logic';
import { MacroProperties } from './macro';

/**
 * Per-kind declarations of which reference kinds (font, line, fill, string-variable,
 * number-variable) an object can accept. Used to determine when a newly created
 * reference object can be attached to the currently selected object.
 */
const acceptsReferences: Partial<Record<ObjectKind, readonly ReferenceKind[]>> = {
  'output-string':            ['font-attribute', 'string-variable'],
  'output-number':            ['font-attribute', 'number-variable'],
  'output-rectangle':         ['line-attribute', 'fill-attribute'],
  'output-polygon':           ['line-attribute', 'fill-attribute'],
  'output-ellipse':           ['line-attribute', 'fill-attribute'],
  'output-meter':             ['number-variable'],
  'output-linear-bar-graph':  ['number-variable'],
  'output-arched-bar-graph':  ['number-variable'],
  'input-boolean':            ['font-attribute', 'number-variable'],
  'input-string':             ['font-attribute', 'string-variable'],
  'input-number':             ['font-attribute', 'number-variable'],
  'input-list':               ['number-variable'],
};

function compose<K extends ObjectKind>(
  module: Pick<ObjectModule<K>, 'kind' | 'meta' | 'exportOrder' | 'writer'> & Partial<ObjectModule<K>>,
  Properties: ObjectModule<K>['Properties'],
): ObjectModule<K> {
  return { ...module, Properties, acceptsReferences: acceptsReferences[module.kind] } as ObjectModule<K>;
}

/**
 * Single source of truth for every object kind. Combines metadata, defaults,
 * validation, export serialization, the property panel component, and the set
 * of reference kinds the object accepts.
 *
 * Replaces the older `metaRegistry`, `writerRegistry`, `extractedModules`, and
 * `objectPropertyComponents` maps — they were all derived from the same modules
 * and had to be kept in sync by hand.
 */
export const objectRegistry = {
  'data-mask':                compose(dataMaskModule, DataMaskProperties),
  'alarm-mask':               compose(alarmMaskModule, AlarmMaskProperties),
  'container':                compose(containerModule, ContainerProperties),
  'soft-key-mask':            compose(softKeyMaskModule, SoftKeyMaskProperties),
  'key':                      compose(keyModule, KeyProperties),
  'button':                   compose(buttonModule, ButtonProperties),
  'input-boolean':            compose(inputBooleanModule, InputBooleanProperties),
  'input-string':             compose(inputStringModule, InputStringProperties),
  'input-number':             compose(inputNumberModule, InputNumberProperties),
  'input-list':               compose(inputListModule, InputListProperties),
  'output-string':            compose(outputStringModule, OutputStringProperties),
  'output-number':            compose(outputNumberModule, OutputNumberProperties),
  'output-line':              compose(outputLineModule, OutputLineProperties),
  'output-polygon':           compose(outputPolygonModule, OutputPolygonProperties),
  'output-ellipse':           compose(outputEllipseModule, OutputEllipseProperties),
  'output-rectangle':         compose(outputRectangleModule, OutputRectangleProperties),
  'output-meter':             compose(outputMeterModule, OutputMeterProperties),
  'output-linear-bar-graph':  compose(outputLinearBarGraphModule, OutputLinearBarGraphProperties),
  'output-arched-bar-graph':  compose(outputArchedBarGraphModule, OutputArchedBarGraphProperties),
  'picture-graphic':          compose(pictureGraphicModule, PictureGraphicProperties),
  'font-attribute':           compose(fontAttributeModule, FontAttributeProperties),
  'line-attribute':           compose(lineAttributeModule, LineAttributeProperties),
  'fill-attribute':           compose(fillAttributeModule, FillAttributeProperties),
  'string-variable':          compose(stringVariableModule, StringVariableProperties),
  'number-variable':          compose(numberVariableModule, NumberVariableProperties),
  'object-pointer':           compose(objectPointerModule, ObjectPointerProperties),
  'macro':                    compose(macroModule, MacroProperties),
} satisfies Record<ObjectKind, ObjectModule>;

export const objectKinds = Object.keys(objectRegistry) as ObjectKind[];

/** True if the given object kind can attach a newly created reference of `refKind`. */
export function acceptsReference(kind: ObjectKind, refKind: ReferenceKind): boolean {
  return objectRegistry[kind].acceptsReferences?.includes(refKind) ?? false;
}
