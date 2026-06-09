import { vtColor } from '../../domain/isobus';
import type { EditorObject } from '../../domain/types';

/** Convert ISOBUS lineArt hex string to SVG strokeDasharray scaled by strokeWidth. */
function lineArtToDash(lineArt = '0xFFFF', strokeWidth: number): string | undefined {
  const n = lineArt.toUpperCase();
  if (n === '0XFFFF') return undefined;                          // solid
  if (n === '0XF0F0') return `${strokeWidth * 4} ${strokeWidth * 2}`;  // dashed
  if (n === '0XAAAA') return `${strokeWidth} ${strokeWidth * 2}`;       // dotted
  // Generic 16-bit pattern: convert run-length to dash array
  const bits = parseInt(lineArt, 16);
  if (isNaN(bits)) return undefined;
  const dashes: number[] = [];
  let current = (bits >> 15) & 1;
  let run = 0;
  for (let i = 15; i >= 0; i--) {
    const bit = (bits >> i) & 1;
    if (bit === current) {
      run++;
    } else {
      dashes.push(run * strokeWidth);
      current = bit;
      run = 1;
    }
  }
  dashes.push(run * strokeWidth);
  // If pattern doesn't start with a filled bit, prepend a zero gap
  if (((bits >> 15) & 1) === 0) dashes.unshift(0);
  return dashes.join(' ');
}

export function OutputLineContent({ object, line }: { object: EditorObject; line?: EditorObject }) {
  const strokeColor = vtColor(line?.lineColor ?? 0);
  const strokeWidth = Math.max(1, line?.lineWidth ?? 1);
  const dir = object.lineDirection ?? 0;
  const dashArray = lineArtToDash(line?.lineArt, strokeWidth);

  // direction 0 ↘: top-left → bottom-right
  // direction 1 ↗: bottom-left → top-right
  const x1 = 0;
  const y1 = dir === 0 ? 0 : '100%';
  const x2 = '100%';
  const y2 = dir === 0 ? '100%' : 0;

  return (
    <svg
      aria-label={dir === 0 ? 'Line ↘' : 'Line ↗'}
      style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', overflow: 'visible' }}
      xmlns="http://www.w3.org/2000/svg"
    >
      <line
        x1={x1} y1={y1}
        x2={x2} y2={y2}
        stroke={strokeColor}
        strokeWidth={strokeWidth}
        strokeDasharray={dashArray}
        vectorEffect="non-scaling-stroke"
      />
    </svg>
  );
}
