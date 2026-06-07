import { formatOutputNumber } from '../../domain/isobus';
import type { EditorObject } from '../../domain/types';

export function OutputNumberContent({ object, font, numberVariable }: { object: EditorObject; font?: EditorObject; numberVariable?: EditorObject }) {
  const charWidth = Math.max(1, Math.floor(Math.max(1, object.width - 8) / (font?.fontWidth ?? font?.fontHeight ?? font?.fontSize ?? 16)));
  return (
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
  );
}
