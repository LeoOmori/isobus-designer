import type { ReactNode } from 'react';
import type { EditorObject } from '../../domain/types';

export function InputListContent({ object, children }: { object: EditorObject; children: ReactNode }) {
  const enabled = object.inputEnabled ?? true;

  return (
    <>
      <div style={{ position: 'absolute', inset: 0, overflow: 'hidden' }}>
        {children}
      </div>
      {!enabled && (
        <div
          style={{
            position: 'absolute', inset: 0,
            background: 'repeating-linear-gradient(45deg, transparent, transparent 3px, rgba(128,128,128,0.35) 3px, rgba(128,128,128,0.35) 4px)',
            pointerEvents: 'none',
          }}
        />
      )}
    </>
  );
}
