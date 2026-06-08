import { vtColor } from '../../domain/isobus';
import type { EditorObject } from '../../domain/types';

export function InputBooleanContent({ object, fontAttr }: { object: EditorObject; fontAttr?: EditorObject }) {
  const isTrue = (object.value ?? 0) > 0;
  const enabled = object.inputEnabled ?? true;
  const strokeColor = vtColor(fontAttr?.fontColor ?? 0);

  return (
    <div style={{ position: 'absolute', inset: 0, overflow: 'hidden' }}>
      {isTrue && (
        <svg
          viewBox="0 0 100 100"
          aria-label="checked"
          style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }}
          xmlns="http://www.w3.org/2000/svg"
        >
          <polyline
            points="20,55 42,75 82,25"
            fill="none"
            stroke={strokeColor}
            strokeWidth="13"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      )}
      {!enabled && (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: 'repeating-linear-gradient(45deg, transparent, transparent 3px, rgba(128,128,128,0.35) 3px, rgba(128,128,128,0.35) 4px)',
            pointerEvents: 'none',
          }}
        />
      )}
    </div>
  );
}
