import type { ObjectKind } from '../domain/types';
import { writeButton } from '../domain/export/writers/button';
import { writeContainer } from '../domain/export/writers/container';
import { writeDataMask } from '../domain/export/writers/dataMask';
import { writeKey } from '../domain/export/writers/key';
import { writeOutputNumber } from '../domain/export/writers/outputNumber';
import { writeOutputRectangle } from '../domain/export/writers/outputRectangle';
import { outputStringModule } from './output-string/module';
import { writePictureGraphic } from '../domain/export/writers/pictureGraphic';
import { writeSoftKeyMask } from '../domain/export/writers/softKeyMask';
import type { ObjectModule } from './ObjectModule';
import { fillAttributeModule } from './fill-attribute/logic';
import { fontAttributeModule } from './font-attribute/logic';
import { lineAttributeModule } from './line-attribute/logic';
import { numberVariableModule } from './number-variable/logic';
import { stringVariableModule } from './string-variable/logic';

export const writerModules = {
  'font-attribute':    fontAttributeModule,
  'line-attribute':    lineAttributeModule,
  'fill-attribute':    fillAttributeModule,
  'number-variable':   numberVariableModule,
  'string-variable':   stringVariableModule,
  'picture-graphic':   { exportOrder: 5,  writer: writePictureGraphic },
  'output-string':     outputStringModule,
  'output-number':     { exportOrder: 7,  writer: writeOutputNumber },
  'output-rectangle':  { exportOrder: 8,  writer: writeOutputRectangle },
  'container':         { exportOrder: 9,  writer: writeContainer },
  'button':            { exportOrder: 10, writer: writeButton },
  'key':               { exportOrder: 11, writer: writeKey },
  'soft-key-mask':     { exportOrder: 12, writer: writeSoftKeyMask },
  'data-mask':         { exportOrder: 13, writer: writeDataMask },
} satisfies Record<ObjectKind, Pick<ObjectModule, 'exportOrder' | 'writer'>>;
