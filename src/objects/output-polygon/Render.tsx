import { lineArtToDash, vtColor } from '../../domain/isobus';
import type { EditorObject } from '../../domain/types';

export function OutputPolygonContent({ object, line, fill }: { object: EditorObject; line?: EditorObject; fill?: EditorObject }) {
  const points = object.polygonPoints ?? [];
  if (points.length < 3) return null;

  const strokeColor = vtColor(line?.lineColor ?? 0);
  const strokeWidth = Math.max(1, line?.lineWidth ?? 1);
  const strokeDash = lineArtToDash(line?.lineArt, strokeWidth);
  const fillColor = vtColor(fill?.fillColor ?? 0);
  const fillType = fill?.fillType ?? 0;
  const polygonType = object.polygonType ?? 2;

  const hasFill = polygonType !== 3 && (fillType === 1 || fillType === 2);
  const svgFill = hasFill ? (fillType === 1 ? strokeColor : fillColor) : 'none';

  const pointString = points.map((p) => `${p.x},${p.y}`).join(' ');

  return (
    <svg
      aria-label="Polygon"
      style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', overflow: 'visible' }}
      xmlns="http://www.w3.org/2000/svg"
    >
      {polygonType === 3 ? (
        // Open polygon: draw polyline (no fill)
        <polyline
          points={pointString}
          stroke={strokeColor}
          strokeWidth={strokeWidth}
          strokeDasharray={strokeDash}
          fill="none"
          vectorEffect="non-scaling-stroke"
        />
      ) : (
        // Closed polygon: use evenodd fill rule per ISO spec
        <polygon
          points={pointString}
          stroke={strokeColor}
          strokeWidth={strokeWidth}
          strokeDasharray={strokeDash}
          fill={svgFill}
          fillRule="evenodd"
          vectorEffect="non-scaling-stroke"
        />
      )}
    </svg>
  );
}
