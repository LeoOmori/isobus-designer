import type { ObjectKind } from '../domain/types';
import { alarmMaskModule } from './alarm-mask/logic';
import { buttonModule } from './button/logic';
import { containerModule } from './container/logic';
import { dataMaskModule } from './data-mask/logic';
import { inputBooleanModule } from './input-boolean/logic';
import { inputStringModule } from './input-string/logic';
import { inputNumberModule } from './input-number/logic';
import { inputListModule } from './input-list/logic';
import { outputEllipseModule } from './output-ellipse/logic';
import { outputLineModule } from './output-line/logic';
import { outputPolygonModule } from './output-polygon/logic';
import { outputNumberModule } from './output-number/logic';
import { outputMeterModule } from './output-meter/logic';
import { outputLinearBarGraphModule } from './output-linear-bar-graph/logic';
import { outputRectangleModule } from './output-rectangle/logic';
import { outputStringModule } from './output-string/module';
import { pictureGraphicModule } from './picture-graphic/logic';
import { softKeyMaskModule } from './soft-key-mask/logic';
import type { ObjectModule } from './ObjectModule';
import { fillAttributeModule } from './fill-attribute/logic';
import { fontAttributeModule } from './font-attribute/logic';
import { keyModule } from './key/logic';
import { lineAttributeModule } from './line-attribute/logic';
import { numberVariableModule } from './number-variable/logic';
import { stringVariableModule } from './string-variable/logic';
import { objectPointerModule } from './object-pointer/logic';

export const writerModules = {
  'font-attribute':    fontAttributeModule,
  'line-attribute':    lineAttributeModule,
  'fill-attribute':    fillAttributeModule,
  'number-variable':   numberVariableModule,
  'string-variable':   stringVariableModule,
  'picture-graphic':   pictureGraphicModule,
  'output-string':     outputStringModule,
  'output-line':       outputLineModule,
  'output-polygon':    outputPolygonModule,
  'output-ellipse':    outputEllipseModule,
  'output-number':     outputNumberModule,
  'output-rectangle':  outputRectangleModule,
  'output-meter':      outputMeterModule,
  'output-linear-bar-graph': outputLinearBarGraphModule,
  'container':         containerModule,
  'button':            buttonModule,
  'input-boolean':     inputBooleanModule,
  'input-string':      inputStringModule,
  'input-number':      inputNumberModule,
  'input-list':        inputListModule,
  'key':               keyModule,
  'soft-key-mask':     softKeyMaskModule,
  'data-mask':         dataMaskModule,
  'alarm-mask':        alarmMaskModule,
  'object-pointer':    objectPointerModule,
} satisfies Record<ObjectKind, Pick<ObjectModule, 'exportOrder' | 'writer'>>;
