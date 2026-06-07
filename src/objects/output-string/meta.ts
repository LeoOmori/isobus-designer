import { Type } from 'lucide-react';
import type { ObjectMeta } from '../ObjectModule';

export const outputStringMeta = {
  name: 'Output String',
  Icon: Type,
  category: 'output',
  isReference: false,
  hasLayout: true,
} satisfies ObjectMeta;
