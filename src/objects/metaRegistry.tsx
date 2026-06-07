import { Keyboard, LayoutPanelLeft } from 'lucide-react';
import type { ObjectKind } from '../domain/types';
import type { ObjectMeta } from './ObjectModule';
import { buttonMeta } from './button/logic';
import { containerMeta } from './container/logic';
import { fillAttributeMeta } from './fill-attribute/logic';
import { fontAttributeMeta } from './font-attribute/logic';
import { keyMeta } from './key/logic';
import { lineAttributeMeta } from './line-attribute/logic';
import { numberVariableMeta } from './number-variable/logic';
import { outputNumberMeta } from './output-number/logic';
import { outputRectangleMeta } from './output-rectangle/logic';
import { outputStringMeta } from './output-string/meta';
import { pictureGraphicMeta } from './picture-graphic/logic';
import { stringVariableMeta } from './string-variable/logic';

export const metaRegistry = {
  'data-mask':        { name: 'Data Mask',        Icon: LayoutPanelLeft,   category: 'screen',    isReference: false, hasLayout: true },
  'container':        containerMeta,
  'soft-key-mask':    { name: 'Soft Key Mask',    Icon: Keyboard,          category: 'screen',    isReference: false, hasLayout: false },
  'key':              keyMeta,
  'button':           buttonMeta,
  'output-string':    outputStringMeta,
  'output-number':    outputNumberMeta,
  'output-rectangle': outputRectangleMeta,
  'picture-graphic':  pictureGraphicMeta,
  'font-attribute':   fontAttributeMeta,
  'line-attribute':   lineAttributeMeta,
  'fill-attribute':   fillAttributeMeta,
  'string-variable':  stringVariableMeta,
  'number-variable':  numberVariableMeta,
} satisfies Record<ObjectKind, ObjectMeta>;
