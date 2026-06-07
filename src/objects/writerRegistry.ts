import type { ObjectKind } from '../domain/types';
import { writeDataMask } from '../domain/export/writers/dataMask';
import { buttonModule } from './button/logic';
import { containerModule } from './container/logic';
import { outputNumberModule } from './output-number/logic';
import { outputRectangleModule } from './output-rectangle/logic';
import { outputStringModule } from './output-string/module';
import { pictureGraphicModule } from './picture-graphic/logic';
import { writeSoftKeyMask } from '../domain/export/writers/softKeyMask';
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
  'key':               keyModule,
  'soft-key-mask':     { exportOrder: 12, writer: writeSoftKeyMask },
  'data-mask':         { exportOrder: 13, writer: writeDataMask },
} satisfies Record<ObjectKind, Pick<ObjectModule, 'exportOrder' | 'writer'>>;
