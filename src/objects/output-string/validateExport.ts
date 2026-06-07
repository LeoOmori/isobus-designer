import type { EditorObject, ProjectState } from '../../domain/types';
import { encodeLatin1Padded, isLatin1 } from '../../domain/export/encoding';
import type { ObjectLookup } from '../ObjectModule';

export function validateOutputStringForExport(obj: EditorObject, _project: ProjectState, _lookup: ObjectLookup): string[] {
  const errors: string[] = [];
  const text = obj.text ?? '';
  if (!isLatin1(text)) {
    errors.push(`Export: Output String ${obj.id} text contains non-Latin-1 characters (V1 supports ISO 8859-1 only)`);
  } else {
    const length = obj.length ?? 0;
    if (length > 0) {
      const encoded = encodeLatin1Padded(text, length);
      if (text.length > length) {
        errors.push(`Export: Output String ${obj.id} text (${text.length} chars) exceeds fixed length ${length}`);
      }
      void encoded;
    }
  }

  return errors;
}
