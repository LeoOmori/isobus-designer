import { metaRegistry } from '../objects/metaRegistry';
import type { ObjectKind } from './types';

export function objectKindName(kind: ObjectKind): string {
  return metaRegistry[kind].name;
}

export function KindIcon({ kind, size = 16 }: { kind: ObjectKind; size?: number }) {
  const Icon = metaRegistry[kind].Icon;
  return <Icon size={size} />;
}
