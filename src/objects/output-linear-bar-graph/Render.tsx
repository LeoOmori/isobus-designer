import React from 'react';
import { vtColor } from '../../domain/isobus';
import type { EditorObject } from '../../domain/types';

function clampBarValue(v: number, min: number, max: number) {
  if (min >= max) return min;
  return Math.min(max, Math.max(min, v));
}

function drawBarValue(
  ctx: CanvasRenderingContext2D, 
  obj: EditorObject, 
  x: number, 
  y: number, 
  ratio: number
) {
  const options = obj.linearBarOptions ?? 1;
  const horizontal = (options & 16) !== 0;     // bit 4
  const positive = (options & 32) !== 0;       // bit 5
  const singleLineMode = (options & 8) !== 0;  // bit 3

  ctx.fillStyle = vtColor(obj.backgroundColorIndex ?? 2);
  ctx.strokeStyle = vtColor(obj.backgroundColorIndex ?? 2);

  if (horizontal) {
    const valueWidth = obj.width * ratio;
    const valueX = positive ? x : x + obj.width * (1 - ratio);

    if (singleLineMode) {
      const lineX = positive ? x + obj.width * ratio : x + obj.width * (1 - ratio);
      ctx.beginPath();
      ctx.moveTo(lineX, y);
      ctx.lineTo(lineX, y + obj.height);
      ctx.stroke();
    } else {
      ctx.fillRect(valueX, y, valueWidth, obj.height);
    }
  } else {
    const valueHeight = obj.height * ratio;
    const valueY = positive ? y + obj.height - valueHeight : y;

    if (singleLineMode) {
      const lineY = positive ? y + obj.height - obj.height * ratio : y + obj.height * ratio;
      ctx.beginPath();
      ctx.moveTo(x, lineY);
      ctx.lineTo(x + obj.width, lineY);
      ctx.stroke();
    } else {
      ctx.fillRect(x, valueY, obj.width, valueHeight);
    }
  }
}

function drawTargetLine(
  ctx: CanvasRenderingContext2D, 
  obj: EditorObject, 
  x: number, 
  y: number, 
  ratio: number
) {
  const options = obj.linearBarOptions ?? 1;
  const horizontal = (options & 16) !== 0;     // bit 4
  const positive = (options & 32) !== 0;       // bit 5

  ctx.strokeStyle = vtColor(obj.targetLineColor ?? 0);

  if (horizontal) {
    const lineX = positive ? x + obj.width * ratio : x + obj.width * (1 - ratio);
    ctx.beginPath();
    ctx.moveTo(lineX, y);
    ctx.lineTo(lineX, y + obj.height);
    ctx.stroke();
  } else {
    const lineY = positive ? y + obj.height - obj.height * ratio : y + obj.height * ratio;
    ctx.beginPath();
    ctx.moveTo(x, lineY);
    ctx.lineTo(x + obj.width, lineY);
    ctx.stroke();
  }
}

function drawLinearBarTicks(
  ctx: CanvasRenderingContext2D, 
  obj: EditorObject, 
  x: number, 
  y: number
) {
  const options = obj.linearBarOptions ?? 1;
  const horizontal = (options & 16) !== 0;     // bit 4
  const numberOfTicks = obj.numberOfTicks ?? 0;

  if (numberOfTicks <= 0) return;

  ctx.strokeStyle = vtColor(obj.backgroundColorIndex ?? 2);

  for (let i = 0; i <= numberOfTicks; i++) {
    const ratio = numberOfTicks > 0 ? i / numberOfTicks : 0;
    
    if (horizontal) {
      const tickX = x + obj.width * ratio;
      ctx.beginPath();
      ctx.moveTo(tickX, y);
      ctx.lineTo(tickX, y + obj.height);
      ctx.stroke();
    } else {
      const tickY = y + obj.height * ratio;
      ctx.beginPath();
      ctx.moveTo(x, tickY);
      ctx.lineTo(x + obj.width, tickY);
      ctx.stroke();
    }
  }
}

export function OutputLinearBarGraphContent({ object, numberVariable, targetNumberVariable }: {
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

    const options = object.linearBarOptions ?? 1;

    // Clip to canvas bounds
    ctx.save();
    ctx.beginPath();
    ctx.rect(0, 0, object.width, object.height);
    ctx.clip();

    // Draw border
    if ((options & 1) !== 0) { // bit 0: drawBorder
      ctx.strokeStyle = vtColor(object.backgroundColorIndex ?? 2);
      ctx.strokeRect(0, 0, object.width, object.height);
    }

    // Draw bar value
    drawBarValue(ctx, object, 0, 0, ratio);

    // Draw target line
    if ((options & 2) !== 0) { // bit 1: drawTargetLine
      drawTargetLine(ctx, object, 0, 0, targetRatio);
    }

    // Draw ticks
    if ((options & 4) !== 0) { // bit 2: drawTicks
      drawLinearBarTicks(ctx, object, 0, 0);
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