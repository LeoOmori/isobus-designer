import { useEffect } from 'react';
import type { CSSProperties, ReactNode } from 'react';
import type { EditorObject } from '../../domain/types';

export function ObjectPointerSync({
  pointer, target, onPatch,
}: {
  pointer: EditorObject;
  target: EditorObject;
  onPatch: (id: string, changes: Partial<EditorObject>) => void;
}) {
  useEffect(() => {
    if (pointer.width !== target.width || pointer.height !== target.height) {
      onPatch(pointer.id, { width: target.width, height: target.height });
    }
  }, [pointer.id, pointer.width, pointer.height, target.width, target.height, onPatch]);
  return null;
}

export function ObjectPointerNullContent({ name }: { name: string }) {
  return (
    <>
      <div style={labelStyle}>{name}</div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%', height: '100%', fontSize: 10, color: '#999', fontStyle: 'italic' }}>
        null
      </div>
    </>
  );
}

export function ObjectPointerTargetContent({
  name, targetWidth, targetHeight, targetFrameStyle, children,
}: {
  name: string;
  targetWidth: number;
  targetHeight: number;
  targetFrameStyle: CSSProperties;
  children: ReactNode;
}) {
  return (
    <>
      <div style={labelStyle}>{name}</div>
      <div style={{ position: 'absolute', top: 0, left: 0, width: targetWidth, height: targetHeight, ...targetFrameStyle }}>
        {children}
      </div>
    </>
  );
}

const labelStyle: CSSProperties = {
  position: 'absolute',
  top: -15,
  left: 0,
  zIndex: 10,
  fontSize: 8,
  fontWeight: 600,
  color: '#64748b',
  background: '#e2e8f0',
  padding: '1px 5px',
  borderRadius: '0 0 4px 0',
  whiteSpace: 'nowrap',
  maxWidth: 80,
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  pointerEvents: 'none',
};

export function objectPointerFrameStyle(_object: EditorObject): CSSProperties {
  return {
    borderColor: '#94a3b8',
    borderWidth: 1,
    borderStyle: 'dashed',
    background: 'transparent',
    overflow: 'visible',
  };
}
