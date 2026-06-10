import React from 'react';
import { vtColor } from '../../domain/isobus';
import type { EditorObject } from '../../domain/types';

function clampBarValue(v: number, min: number, max: number) {
  if (min >= max) return min;
  return Math.min(max, Math.max(min, v));
}

function degToRad(deg: number): number {
  return (deg * Math.PI) / 180;
}

function arcBorderPath(
  ctx: CanvasRenderingContext2D,
  cx: number, cy: number,
  outerRx: number, outerRy: number,
  innerRx: number, innerRy: number,
  startAngleDeg: number, endAngleDeg: number,
  clockwise: boolean,
) {
  let arcSpan: number;
  if (startAngleDeg === endAngleDeg) {
    arcSpan = 360;
  } else {
    arcSpan = clockwise
      ? ((endAngleDeg - startAngleDeg + 360) % 360) || 360
      : ((startAngleDeg - endAngleDeg + 360) % 360) || 360;
  }
  const startRad = degToRad(startAngleDeg - 90);
  const endRad = degToRad(
    (clockwise ? startAngleDeg + arcSpan : startAngleDeg - arcSpan) - 90
  );
  ctx.beginPath();
  ctx.ellipse(cx, cy, outerRx, outerRy, 0, startRad, endRad, !clockwise);
  ctx.ellipse(cx, cy, innerRx, innerRy, 0, endRad, startRad, clockwise);
  ctx.closePath();
}

function drawArchedValue(
  ctx: CanvasRenderingContext2D,
  obj: EditorObject,
  cx: number, cy: number,
  outerRx: number, outerRy: number,
  innerRx: number, innerRy: number,
  startAngleDeg: number, endAngleDeg: number,
  ratio: number
) {
  const options = obj.archedBarOptions ?? 3;
  const clockwise = (options & 16) !== 0;       // bit 4
  const valueAsLine = (options & 8) !== 0;      // bit 3
  
  ctx.fillStyle = vtColor(obj.backgroundColorIndex ?? 2);
  ctx.strokeStyle = vtColor(obj.backgroundColorIndex ?? 2);
  ctx.lineWidth = 2;
  
  let arcSpan: number;
  let valueAngleDeg: number;
  
  if (startAngleDeg === endAngleDeg) {
    arcSpan = 360;
    valueAngleDeg = startAngleDeg + ratio * arcSpan;
  } else {
    arcSpan = clockwise 
      ? ((endAngleDeg - startAngleDeg + 360) % 360) || 360
      : ((startAngleDeg - endAngleDeg + 360) % 360) || 360;
    
    valueAngleDeg = clockwise
      ? startAngleDeg + ratio * arcSpan
      : startAngleDeg - ratio * arcSpan;
  }
  
  const startRad = degToRad(startAngleDeg - 90);
  const valueRad = degToRad(valueAngleDeg - 90);
  
  if (valueAsLine) {
    const x1 = cx + innerRx * Math.cos(valueRad);
    const y1 = cy + innerRy * Math.sin(valueRad);
    const x2 = cx + outerRx * Math.cos(valueRad);
    const y2 = cy + outerRy * Math.sin(valueRad);
    
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.stroke();
  } else {
    if (ratio > 0) {
      ctx.beginPath();
      ctx.ellipse(cx, cy, outerRx, outerRy, 0, startRad, valueRad, !clockwise);
      ctx.ellipse(cx, cy, innerRx, innerRy, 0, valueRad, startRad, clockwise);
      ctx.closePath();
      ctx.fill();
    }
  }
}

function drawTargetLine(
  ctx: CanvasRenderingContext2D,
  obj: EditorObject,
  cx: number, cy: number,
  outerRx: number, outerRy: number,
  innerRx: number, innerRy: number,
  startAngleDeg: number, endAngleDeg: number,
  targetRatio: number
) {
  const options = obj.archedBarOptions ?? 3;
  const clockwise = (options & 16) !== 0;
  
  ctx.strokeStyle = vtColor(obj.targetLineColor ?? 4);
  ctx.lineWidth = 2;
  
  let arcSpan: number;
  let targetAngleDeg: number;
  
  if (startAngleDeg === endAngleDeg) {
    arcSpan = 360;
    targetAngleDeg = startAngleDeg + targetRatio * arcSpan;
  } else {
    arcSpan = clockwise 
      ? ((endAngleDeg - startAngleDeg + 360) % 360) || 360
      : ((startAngleDeg - endAngleDeg + 360) % 360) || 360;
    
    targetAngleDeg = clockwise
      ? startAngleDeg + targetRatio * arcSpan
      : startAngleDeg - targetRatio * arcSpan;
  }
  
  const targetRad = degToRad(targetAngleDeg - 90);
  const x1 = cx + innerRx * Math.cos(targetRad);
  const y1 = cy + innerRy * Math.sin(targetRad);
  const x2 = cx + outerRx * Math.cos(targetRad);
  const y2 = cy + outerRy * Math.sin(targetRad);
  
  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.lineTo(x2, y2);
  ctx.stroke();
}

export function OutputArchedBarGraphContent({ object, numberVariable, targetNumberVariable }: {
  object: EditorObject;
  numberVariable?: EditorObject;
  targetNumberVariable?: EditorObject;
}) {
  const canvasRef = React.useRef<HTMLCanvasElement>(null);

  React.useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear canvas
    ctx.clearRect(0, 0, object.width, object.height);

    // Get values
    const rawValue = object.variableReference && numberVariable
      ? (numberVariable.value ?? 0)
      : (object.value ?? 0);

    const rawTarget = object.targetValueVariableReference && targetNumberVariable
      ? (targetNumberVariable.value ?? 0)
      : (object.targetValue ?? 0);

    const minVal = object.minValue ?? 0;
    const maxVal = object.maxValue ?? 100;
    const value = clampBarValue(rawValue, minVal, maxVal);
    const target = clampBarValue(rawTarget, minVal, maxVal);

    const range = maxVal > minVal ? maxVal - minVal : 1;
    const ratio = (value - minVal) / range;
    const targetRatio = (target - minVal) / range;

    const options = object.archedBarOptions ?? 3;
    const clockwise = (options & 16) !== 0; // bit 4
    
    // Calculate arc geometry — elliptical so both width/height affect the arc
    const cx = object.width / 2;
    const cy = object.height / 2;
    const barWidth = Math.min(object.barGraphWidth ?? 12, Math.min(object.width, object.height) / 3);
    const outerRx = Math.max(cx - 2, 1);
    const outerRy = Math.max(cy - 2, 1);
    const innerRx = Math.max(outerRx - barWidth, 1);
    const innerRy = Math.max(outerRy - barWidth, 1);
    
    const startAngleDeg = (object.arcStartAngle ?? 45) * 2;  // Convert from stored value
    const endAngleDeg = (object.arcEndAngle ?? 135) * 2;     // Convert from stored value

    // Clip to canvas bounds
    ctx.save();
    ctx.beginPath();
    ctx.rect(0, 0, object.width, object.height);
    ctx.clip();

    // Draw border around arc
    if ((options & 1) !== 0) { // bit 0: drawBorder
      ctx.strokeStyle = vtColor(object.backgroundColorIndex ?? 2);
      ctx.lineWidth = 1;
      arcBorderPath(ctx, cx, cy, outerRx, outerRy, innerRx, innerRy, startAngleDeg, endAngleDeg, clockwise);
      ctx.stroke();
    }

    // Draw arc value
    drawArchedValue(ctx, object, cx, cy, outerRx, outerRy, innerRx, innerRy, startAngleDeg, endAngleDeg, ratio);

    // Draw target line
    if ((options & 2) !== 0) { // bit 1: drawTargetLine
      drawTargetLine(ctx, object, cx, cy, outerRx, outerRy, innerRx, innerRy, startAngleDeg, endAngleDeg, targetRatio);
    }

    ctx.restore();
  }, [object, numberVariable, targetNumberVariable]);

  return (
    <canvas
      ref={canvasRef}
      width={object.width}
      height={object.height}
      style={{ display: 'block', width: '100%', height: '100%' }}
    />
  );
}