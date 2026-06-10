import { objectRegistry } from '../objects/registry';
import type { ObjectKind } from './types';

export function objectKindName(kind: ObjectKind): string {
  return objectRegistry[kind].meta.name;
}

export function KindIcon({ kind, size = 16 }: { kind: ObjectKind; size?: number }) {
  const Icon = objectRegistry[kind].meta.Icon;
  return <Icon size={size} />;
}
