import type { ObjectKind } from '../domain/types';
import type { ObjectModule } from './ObjectModule';
import { alarmMaskModule } from './alarm-mask/logic';
import { buttonModule } from './button/logic';
import { outputMeterModule } from './output-meter/logic';
import { outputLinearBarGraphModule } from './output-linear-bar-graph/logic';
import { outputArchedBarGraphModule } from './output-arched-bar-graph/logic';
import { containerModule } from './container/logic';
import { dataMaskModule } from './data-mask/logic';
import { fillAttributeModule } from './fill-attribute/logic';
import { fontAttributeModule } from './font-attribute/logic';
import { inputBooleanModule } from './input-boolean/logic';
import { inputStringModule } from './input-string/logic';
import { inputNumberModule } from './input-number/logic';
import { inputListModule } from './input-list/logic';
import { keyModule } from './key/logic';
import { lineAttributeModule } from './line-attribute/logic';
import { numberVariableModule } from './number-variable/logic';
import { outputEllipseModule } from './output-ellipse/logic';
import { outputLineModule } from './output-line/logic';
import { outputPolygonModule } from './output-polygon/logic';
import { outputNumberModule } from './output-number/logic';
import { outputRectangleModule } from './output-rectangle/logic';
import { outputStringModule } from './output-string/module';
import { pictureGraphicModule } from './picture-graphic/logic';
import { softKeyMaskModule } from './soft-key-mask/logic';
import { stringVariableModule } from './string-variable/logic';
import { objectPointerModule } from './object-pointer/logic';

export const extractedModules: Record<ObjectKind, ObjectModule> = {
  'font-attribute': fontAttributeModule,
  'line-attribute': lineAttributeModule,
  'fill-attribute': fillAttributeModule,
  'number-variable': numberVariableModule,
  'string-variable': stringVariableModule,
  'output-string': outputStringModule,
  'output-line': outputLineModule,
  'output-polygon': outputPolygonModule,
  'output-ellipse': outputEllipseModule,
  'output-number': outputNumberModule,
  'output-rectangle': outputRectangleModule,
  'output-meter':     outputMeterModule,
  'output-linear-bar-graph': outputLinearBarGraphModule,
  'output-arched-bar-graph': outputArchedBarGraphModule,
  'picture-graphic': pictureGraphicModule,
  'container': containerModule,
  'button': buttonModule,
  'input-boolean': inputBooleanModule,
  'input-string': inputStringModule,
  'input-number': inputNumberModule,
  'input-list': inputListModule,
  'key': keyModule,
  'data-mask': dataMaskModule,
  'alarm-mask': alarmMaskModule,
  'soft-key-mask': softKeyMaskModule,
  'object-pointer': objectPointerModule,
} satisfies Record<ObjectKind, ObjectModule>;
