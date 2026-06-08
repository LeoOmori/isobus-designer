import { formatOutputNumber } from '../../domain/isobus';
import type { EditorObject } from '../../domain/types';

export function InputNumberContent({ object, font, numberVariable }: { object: EditorObject; font?: EditorObject; numberVariable?: EditorObject }) {
  const charWidth = Math.max(1, Math.floor(Math.max(1, object.width - 8) / (font?.fontWidth ?? font?.fontHeight ?? font?.fontSize ?? 16)));
  const enabled = object.inputEnabled ?? true;
  return (
    <>
      <span className="inline-text-editor">
        {formatOutputNumber(
          numberVariable?.value ?? object.value ?? 0,
          object.offset ?? 0,
          object.scale ?? 1,
          object.numberOfDecimals ?? 0,
          object.numberFormat ?? 0,
          object.outputOptions ?? 0,
          charWidth,
        )}
      </span>
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
    </>
  );
}
