import { describe, expect, it } from 'vitest';
import { OUTPUT_NUMBER_OPTION_LEADING_ZEROS, OUTPUT_NUMBER_OPTION_TRUNCATE, OUTPUT_NUMBER_OPTION_ZERO_AS_BLANK, formatOutputNumber } from './isobus';

describe('formatOutputNumber', () => {
  it('formats fixed decimal output', () => {
    expect(formatOutputNumber(12.345, 0, 1, 2, 0)).toBe('12.35');
    expect(formatOutputNumber(12.345, 0, 1, 2, 0, OUTPUT_NUMBER_OPTION_TRUNCATE)).toBe('12.34');
  });

  it('formats exponential output and leading zeros', () => {
    expect(formatOutputNumber(1234, 0, 1, 1, 1)).toBe('1.2E+03');
    expect(formatOutputNumber(7, 0, 1, 0, 0, OUTPUT_NUMBER_OPTION_LEADING_ZEROS, 4)).toBe('0007');
  });

  it('supports zero as blank', () => {
    expect(formatOutputNumber(0, 0, 1, 2, 0, OUTPUT_NUMBER_OPTION_ZERO_AS_BLANK)).toBe('');
  });
});
