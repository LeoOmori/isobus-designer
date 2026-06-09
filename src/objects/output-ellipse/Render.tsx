import type { CSSProperties } from 'react';
import { lineArtToDash, vtColor } from '../../domain/isobus';
import type { EditorObject } from '../../domain/types';

/** ISOBUS angles use math convention (Y up, CCW from +X). SVG screen has Y down.
 *  Negating the angle converts it to SVG screen space so cos/sin yield screen coordinates directly. */
function isoAngleToRadians(encodedAngle: number): number {
  const degrees = encodedAngle * 2;
  return -degrees * Math.PI / 180;
}

/** ISOBUS angular span from start to end, going CCW. Returns 0..360. */
function isoAngularSpan(startEncoded: number, endEncoded: number): number {
  const startDeg = startEncoded * 2;
  const endDeg = endEncoded * 2;
  return ((endDeg - startDeg) + 360) % 360;
}

function arcEndpoint(cx: number, cy: number, rx: number, ry: number, encodedAngle: number) {
  const rad = isoAngleToRadians(encodedAngle);
  return { x: cx + rx * Math.cos(rad), y: cy + ry * Math.sin(rad) };
}

/** SVG path command for an open arc from start to end, drawn CCW on screen (matching ISOBUS CCW).
 *  sweep-flag is 0 because isoAngleToRadians already flips Y; CCW math = CCW on screen here. */
function arcPath(cx: number, cy: number, rx: number, ry: number, startEncoded: number, endEncoded: number): string {
  const s = arcEndpoint(cx, cy, rx, ry, startEncoded);
  const e = arcEndpoint(cx, cy, rx, ry, endEncoded);
  const span = isoAngularSpan(startEncoded, endEncoded);
  const largeArc = span > 180 ? 1 : 0;
  return `M ${s.x} ${s.y} A ${rx} ${ry} 0 ${largeArc} 0 ${e.x} ${e.y}`;
}

export function OutputEllipseContent({ object, line, fill }: { object: EditorObject; line?: EditorObject; fill?: EditorObject }) {
  const strokeColor = vtColor(line?.lineColor ?? 0);
  const strokeWidth = Math.max(1, line?.lineWidth ?? 1);
  const strokeDash = lineArtToDash(line?.lineArt, strokeWidth);
  const fillColor = vtColor(fill?.fillColor ?? 0);
  const fillType = fill?.fillType ?? 0;
  const ellipseType = object.ellipseType ?? 0;
  const startAngle = object.startAngle ?? 0;
  const endAngle = object.endAngle ?? 0;

  const cx = object.width / 2;
  const cy = object.height / 2;
  const rx = Math.max(1, cx);
  const ry = Math.max(1, cy);

  const hasFill = fillType === 1 || fillType === 2;
  const svgFill = hasFill ? (fillType === 1 ? strokeColor : fillColor) : 'none';

  const svgStyle: CSSProperties = { position: 'absolute', inset: 0, width: '100%', height: '100%', overflow: 'visible' };

  // Per spec: if type > 0 and start == end (mod 360), draw a closed ellipse.
  const isFullEllipse = ellipseType === 0
    || (ellipseType > 0 && isoAngularSpan(startAngle, endAngle) === 0);

  if (isFullEllipse) {
    return (
      <svg aria-label="Ellipse" style={svgStyle} xmlns="http://www.w3.org/2000/svg">
        <ellipse
          cx={cx} cy={cy} rx={rx} ry={ry}
          stroke={strokeColor}
          strokeWidth={strokeWidth}
          strokeDasharray={strokeDash}
          fill={svgFill}
          vectorEffect="non-scaling-stroke"
        />
      </svg>
    );
  }

  let pathData: string;
  let label: string;

  if (ellipseType === 1) {
    // Open arc: stroke only along the arc itself.
    pathData = arcPath(cx, cy, rx, ry, startAngle, endAngle);
    label = 'Arc';
  } else if (ellipseType === 2) {
    // Closed segment: arc + straight chord back to start.
    pathData = arcPath(cx, cy, rx, ry, startAngle, endAngle) + ' Z';
    label = 'Segment';
  } else {
    // Closed section (pie slice): center → start → arc → end → close back to center.
    const s = arcEndpoint(cx, cy, rx, ry, startAngle);
    const e = arcEndpoint(cx, cy, rx, ry, endAngle);
    const span = isoAngularSpan(startAngle, endAngle);
    const largeArc = span > 180 ? 1 : 0;
    pathData = `M ${cx} ${cy} L ${s.x} ${s.y} A ${rx} ${ry} 0 ${largeArc} 0 ${e.x} ${e.y} Z`;
    label = 'Section';
  }

  // Open arc has no enclosed region, so don't paint a fill across the implicit chord.
  const pathFill = ellipseType === 1 ? 'none' : svgFill;

  return (
    <svg aria-label={label} style={svgStyle} xmlns="http://www.w3.org/2000/svg">
      <path
        d={pathData}
        stroke={strokeColor}
        strokeWidth={strokeWidth}
        strokeDasharray={strokeDash}
        fill={pathFill}
        vectorEffect="non-scaling-stroke"
      />
    </svg>
  );
}
