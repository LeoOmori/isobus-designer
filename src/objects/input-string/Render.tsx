import type { EditorObject } from '../../domain/types';
import { fontCellScaleX, textJustificationTransformOrigin } from '../../domain/isobus';
import { clipUtf8 } from '../output-string/Render';

export function InputStringContent({
  object,
  font,
  stringVariable,
}: {
  object: EditorObject;
  font?: EditorObject;
  stringVariable?: EditorObject;
}) {
  const textScaleX = fontCellScaleX(font);
  const textStyle = {
    transform: `scaleX(${textScaleX})`,
    transformOrigin: textJustificationTransformOrigin(object.horizontalJustification),
  };

  const displayText = stringVariable?.stringValue ?? object.text ?? '';
  const enabled = object.inputEnabled ?? true;

  return (
    <>
      <span className="inline-text-editor" style={textStyle}>
        {clipUtf8(displayText, object.length)}
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
