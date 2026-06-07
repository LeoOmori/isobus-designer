import { Grid3X3, KeyRound, Keyboard, LayoutPanelLeft, MousePointerClick } from 'lucide-react';
import type { ObjectKind } from '../domain/types';
import type { ObjectMeta } from './ObjectModule';
import { fillAttributeMeta } from './fill-attribute/logic';
import { fontAttributeMeta } from './font-attribute/logic';
import { lineAttributeMeta } from './line-attribute/logic';
import { numberVariableMeta } from './number-variable/logic';
import { outputNumberMeta } from './output-number/logic';
import { outputRectangleMeta } from './output-rectangle/logic';
import { outputStringMeta } from './output-string/meta';
import { pictureGraphicMeta } from './picture-graphic/logic';
import { stringVariableMeta } from './string-variable/logic';

export const metaRegistry = {
  'data-mask':        { name: 'Data Mask',        Icon: LayoutPanelLeft,   category: 'screen',    isReference: false, hasLayout: true },
  'container':        { name: 'Container',        Icon: Grid3X3,           category: 'group',     isReference: false, hasLayout: true },
  'soft-key-mask':    { name: 'Soft Key Mask',    Icon: Keyboard,          category: 'screen',    isReference: false, hasLayout: false },
  'key':              { name: 'Key',              Icon: KeyRound,          category: 'input',     isReference: false, hasLayout: false },
  'button':           { name: 'Button',           Icon: MousePointerClick, category: 'input',     isReference: false, hasLayout: true },
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
