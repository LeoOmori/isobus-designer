import type { ObjectKind } from '../domain/types';
import { buttonModule } from './button/logic';
import { containerModule } from './container/logic';
import { dataMaskModule } from './data-mask/logic';
import { inputBooleanModule } from './input-boolean/logic';
import { outputNumberModule } from './output-number/logic';
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

export const writerModules = {
  'font-attribute':    fontAttributeModule,
  'line-attribute':    lineAttributeModule,
  'fill-attribute':    fillAttributeModule,
  'number-variable':   numberVariableModule,
  'string-variable':   stringVariableModule,
  'picture-graphic':   pictureGraphicModule,
  'output-string':     outputStringModule,
  'output-number':     outputNumberModule,
  'output-rectangle':  outputRectangleModule,
  'container':         containerModule,
  'button':            buttonModule,
  'input-boolean':     inputBooleanModule,
  'key':               keyModule,
  'soft-key-mask':     softKeyMaskModule,
  'data-mask':         dataMaskModule,
} satisfies Record<ObjectKind, Pick<ObjectModule, 'exportOrder' | 'writer'>>;
