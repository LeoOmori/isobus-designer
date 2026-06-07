import type { ObjectKind } from '../domain/types';
import type { ObjectModule } from './ObjectModule';
import { buttonModule } from './button/logic';
import { containerModule } from './container/logic';
import { fillAttributeModule } from './fill-attribute/logic';
import { fontAttributeModule } from './font-attribute/logic';
import { keyModule } from './key/logic';
import { lineAttributeModule } from './line-attribute/logic';
import { numberVariableModule } from './number-variable/logic';
import { outputNumberModule } from './output-number/logic';
import { outputRectangleModule } from './output-rectangle/logic';
import { outputStringModule } from './output-string/module';
import { pictureGraphicModule } from './picture-graphic/logic';
import { stringVariableModule } from './string-variable/logic';

export const extractedModules: Partial<Record<ObjectKind, ObjectModule>> = {
  'font-attribute': fontAttributeModule,
  'line-attribute': lineAttributeModule,
  'fill-attribute': fillAttributeModule,
  'number-variable': numberVariableModule,
  'string-variable': stringVariableModule,
  'output-string': outputStringModule,
  'output-number': outputNumberModule,
  'output-rectangle': outputRectangleModule,
  'picture-graphic': pictureGraphicModule,
  'container': containerModule,
  'button': buttonModule,
  'key': keyModule,
};
