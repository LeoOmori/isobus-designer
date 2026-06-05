import { ClipboardList, Grid3X3, LayoutPanelLeft, PenLine, Square, Type } from 'lucide-react';
import type { ObjectKind } from './types';

export function objectKindName(kind: ObjectKind) {
  if (kind === 'data-mask') return 'Data Mask';
  if (kind === 'output-string') return 'Output String';
  if (kind === 'rectangle') return 'Output Rectangle';
  if (kind === 'line-attribute') return 'Line Attribute';
  if (kind === 'fill-attribute') return 'Fill Attribute';
  if (kind === 'font-attribute') return 'Font Attribute';
  return 'String Variable';
}

export function KindIcon({ kind, size = 16 }: { kind: ObjectKind; size?: number }) {
  if (kind === 'data-mask') return <LayoutPanelLeft size={size} />;
  if (kind === 'output-string') return <Type size={size} />;
  if (kind === 'rectangle') return <Square size={size} />;
  if (kind === 'line-attribute') return <PenLine size={size} />;
  if (kind === 'fill-attribute') return <Grid3X3 size={size} />;
  if (kind === 'font-attribute') return <Type size={size} />;
  return <ClipboardList size={size} />;
}
