import { vtColor } from '../../domain/isobus';
import type { EditorObject } from '../../domain/types';

const METER_ARC_RADIUS_RATIO = 0.85;
const METER_NEEDLE_RATIO = 0.75;

function clampMeterValue(v: number, min: number, max: number) {
  if (min >= max) return min;
  return Math.min(max, Math.max(min, v));
}

/**
 * Convert a raw degree (ISOBUS math convention, CCW from +X) to
 * an SVG/CSS radian.  SVG Y is down so we negate the angle.
 */
function degToCanvasRad(deg: number) {
  return (-deg * Math.PI) / 180;
}

/**
 * Packed options: bit0=drawArc, bit1=drawBorder, bit2=drawTicks, bit3=clockwise
 */
function hasOption(options: number | undefined, bit: number) {
  return ((options ?? 0) & (1 << bit)) !== 0;
}

export function OutputMeterContent({ object, numberVariable }: {
  object: EditorObject;
  numberVariable?: EditorObject;
}) {
  const size = object.width;
  const cx = size / 2;
  const cy = size / 2;
  const radius = size / 2;

  const storedStartAngle = object.startAngle ?? 110;
  const storedEndAngle = object.endAngle ?? 35;

  const startDeg = storedStartAngle * 2;
  const endDeg = storedEndAngle * 2;
  const spanDeg = startDeg === endDeg ? 360 : Math.abs(endDeg - startDeg);

  const rawValue = object.variableReference && numberVariable
    ? (numberVariable.value ?? 0)
    : (object.value ?? 0);

  const minVal = object.minValue ?? 0;
  const maxVal = object.maxValue ?? 0;
  const value = clampMeterValue(rawValue, minVal, maxVal);
  const ratio = maxVal > minVal ? (value - minVal) / (maxVal - minVal) : 0;

  const needleColor = vtColor(object.needleColor ?? 0);
  const arcColor = vtColor(object.arcAndTickColor ?? 0);
  const borderColor = vtColor(object.borderColorIndex ?? 0);

  const arcRadius = radius * METER_ARC_RADIUS_RATIO;
  const needleLen = radius * METER_NEEDLE_RATIO;

  const clockwise = hasOption(object.meterOptions, 3);

  // ── Arc / sweep helpers ───────────────────────────────────────────────
  // SVG coordinates: +Y = down, 0° = +X, positive = clockwise.
  // ISOBUS raw degrees (CCW from +X) map to SVG by negating.
  const svgA = ((-startDeg % 360) + 360) % 360;
  const svgB = ((-endDeg % 360) + 360) % 360;
  const cwSweep = (svgB - svgA + 360) % 360;   // CW SVG sweep from start→end
  const ccwSweep = 360 - cwSweep;               // CCW SVG sweep from start→end

  // Clockwise flag controls the sweep direction.
  const arcSweep = clockwise ? cwSweep : ccwSweep;
  const sweepFlag = clockwise ? 1 : 0;
  const largeArcFlag = arcSweep > 180 ? 1 : 0;

  const startRad = degToCanvasRad(startDeg);
  const endRad = degToCanvasRad(endDeg);
  const arcStartX = cx + arcRadius * Math.cos(startRad);
  const arcStartY = cy + arcRadius * Math.sin(startRad);
  const arcEndX = cx + arcRadius * Math.cos(endRad);
  const arcEndY = cy + arcRadius * Math.sin(endRad);

  // ── Needle ─────────────────────────────────────────────────────────────
  // Sweeps by arcSweep from startDeg in the direction specified by clockwise.
  const needleDeg = clockwise
    ? startDeg - ratio * arcSweep
    : startDeg + ratio * arcSweep;
  const needleRad = degToCanvasRad(needleDeg);
  const nx = cx + needleLen * Math.cos(needleRad);
  const ny = cy + needleLen * Math.sin(needleRad);

  // ── Ticks ──────────────────────────────────────────────────────────────
  // Distributed along the same sweep as the arc.
  const ticks: { x1: number; y1: number; x2: number; y2: number }[] = [];
  const numTicks = object.numberOfTicks ?? 5;
  for (let i = 0; i <= numTicks; i++) {
    const t = numTicks > 0 ? i / numTicks : 0;
    const tickDeg = clockwise
      ? startDeg - t * arcSweep
      : startDeg + t * arcSweep;
    const tickRad = degToCanvasRad(tickDeg);
    const innerR = arcRadius * 0.85;
    const outerR = arcRadius;
    ticks.push({
      x1: cx + innerR * Math.cos(tickRad),
      y1: cy + innerR * Math.sin(tickRad),
      x2: cx + outerR * Math.cos(tickRad),
      y2: cy + outerR * Math.sin(tickRad),
    });
  }

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ display: 'block' }}>
      {hasOption(object.meterOptions, 1) && (
        <rect x={1} y={1} width={size - 2} height={size - 2} fill="none" stroke={borderColor} strokeWidth={1} />
      )}
      {hasOption(object.meterOptions, 0) && (
        <path
          d={`M ${arcStartX} ${arcStartY} A ${arcRadius} ${arcRadius} 0 ${largeArcFlag} ${sweepFlag} ${arcEndX} ${arcEndY}`}
          fill="none"
          stroke={arcColor}
          strokeWidth={2}
        />
      )}
      {hasOption(object.meterOptions, 2) && ticks.map((tick, i) => (
        <line key={i} x1={tick.x1} y1={tick.y1} x2={tick.x2} y2={tick.y2} stroke={arcColor} strokeWidth={1} />
      ))}
      <line x1={cx} y1={cy} x2={nx} y2={ny} stroke={needleColor} strokeWidth={2} strokeLinecap="round" />
      <circle cx={cx} cy={cy} r={3} fill={needleColor} />
    </svg>
  );
}
