import { lineArtToDash, vtColor } from '../../domain/isobus';
import type { EditorObject } from '../../domain/types';

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
