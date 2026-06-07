import type { EditorObject } from '../../domain/types';
import { fontCellScaleX, textJustificationTransformOrigin } from '../../domain/isobus';

export function OutputStringContent({
  object,
  font,
  stringVariable,
  isEditing,
  onPatch,
  onEndEditing,
}: {
  object: EditorObject;
  font?: EditorObject;
  stringVariable?: EditorObject;
  isEditing: boolean;
  onPatch: (changes: Partial<EditorObject>) => void;
  onEndEditing: () => void;
}) {
  const textScaleX = fontCellScaleX(font);
  const textStyle = {
    transform: `scaleX(${textScaleX})`,
    transformOrigin: textJustificationTransformOrigin(object.horizontalJustification),
  };

  if (isEditing) {
    return (
      <input
        className="inline-text-input"
        autoFocus
        value={object.text ?? ''}
        style={textStyle}
        onPointerDown={(event) => event.stopPropagation()}
        onDoubleClick={(event) => event.stopPropagation()}
        onChange={(event) => onPatch({ text: event.target.value })}
        onKeyDown={(event) => {
          if (event.key === 'Enter' || event.key === 'Escape') {
            event.preventDefault();
            onEndEditing();
          }
        }}
        onBlur={onEndEditing}
      />
    );
  }

  return (
    <span className="inline-text-editor" style={textStyle}>
      {clipUtf8(stringVariable?.stringValue ?? object.text ?? '', object.length)}
    </span>
  );
}

export function clipUtf8(value: string, maxBytes: number | undefined) {
  if (!maxBytes || maxBytes < 0 || maxBytes >= utf8ByteLength(value)) return value;

  let result = '';
  let bytes = 0;
  for (const char of value) {
    const charBytes = utf8ByteLength(char);
    if (bytes + charBytes > maxBytes) break;
    result += char;
    bytes += charBytes;
  }
  return result;
}

function utf8ByteLength(value: string) {
  return new TextEncoder().encode(value).length;
}
