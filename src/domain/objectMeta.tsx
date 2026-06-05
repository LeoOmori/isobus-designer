import { ClipboardList, Grid3X3, Hash, Image, KeyRound, Keyboard, LayoutPanelLeft, MousePointerClick, PenLine, Square, Type } from 'lucide-react';
import type { ObjectKind } from './types';

export function objectKindName(kind: ObjectKind): string {
  switch (kind) {
    case 'data-mask':        return 'Data Mask';
    case 'soft-key-mask':    return 'Soft Key Mask';
    case 'key':              return 'Key';
    case 'button':           return 'Button';
    case 'output-string':    return 'Output String';
    case 'output-number':    return 'Output Number';
    case 'output-rectangle': return 'Output Rectangle';
    case 'picture-graphic':  return 'Picture Graphic';
    case 'font-attribute':   return 'Font Attribute';
    case 'line-attribute':   return 'Line Attribute';
    case 'fill-attribute':   return 'Fill Attribute';
    case 'string-variable':  return 'String Variable';
    case 'number-variable':  return 'Number Variable';
  }
}

export function KindIcon({ kind, size = 16 }: { kind: ObjectKind; size?: number }) {
  switch (kind) {
    case 'data-mask':        return <LayoutPanelLeft size={size} />;
    case 'soft-key-mask':    return <Keyboard size={size} />;
    case 'key':              return <KeyRound size={size} />;
    case 'button':           return <MousePointerClick size={size} />;
    case 'output-string':    return <Type size={size} />;
    case 'output-number':    return <Hash size={size} />;
    case 'output-rectangle': return <Square size={size} />;
    case 'picture-graphic':  return <Image size={size} />;
    case 'font-attribute':   return <Type size={size} />;
    case 'line-attribute':   return <PenLine size={size} />;
    case 'fill-attribute':   return <Grid3X3 size={size} />;
    case 'string-variable':  return <ClipboardList size={size} />;
    case 'number-variable':  return <Hash size={size} />;
  }
}
