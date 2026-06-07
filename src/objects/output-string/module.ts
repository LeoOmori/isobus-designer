import { writeOutputString } from '../../domain/export/writers/outputString';
import type { ObjectModule } from '../ObjectModule';
import { createDefaultOutputString, migrateOutputString } from './defaults';
import { outputStringMeta } from './meta';
import { validateOutputString } from './validate';
import { validateOutputStringForExport } from './validateExport';

export const outputStringModule = {
  kind: 'output-string',
  meta: outputStringMeta,
  exportOrder: 6,
  writer: writeOutputString,
  createDefault: createDefaultOutputString,
  migrate: migrateOutputString,
  validate: validateOutputString,
  validateExport: validateOutputStringForExport,
} satisfies ObjectModule<'output-string'>;
