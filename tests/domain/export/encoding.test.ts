import { describe, expect, it } from 'vitest';
import { encodeLatin1, encodeLatin1Padded, fontSizeEnum, isLatin1, parseLineArt } from '../../../src/domain/export/encoding';

describe('encoding helpers', () => {
  it('checks latin1 strings', () => {
    expect(isLatin1('Olá')).toBe(true);
    expect(isLatin1('€')).toBe(false);
  });

  it('encodes latin1 with and without padding', () => {
    expect(Array.from(encodeLatin1('Hiÿ'))).toEqual([0x48, 0x69, 0xff]);
    expect(Array.from(encodeLatin1Padded('Hi', 5, 0x20))).toEqual([0x48, 0x69, 0x20, 0x20, 0x20]);
  });

  it('maps font sizes and line art', () => {
    expect(fontSizeEnum(6, 8)).toBe(0);
    expect(fontSizeEnum(7, 7)).toBe(-1);
    expect(parseLineArt(undefined)).toBe(0xffff);
    expect(parseLineArt('0xF0F0')).toBe(0xf0f0);
  });
});
