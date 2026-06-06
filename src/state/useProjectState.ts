import { useCallback, useState } from 'react';
import { initialProject } from '../domain/initialProject';
import {
  OUTPUT_STRING_OPTION_TRANSPARENT,
  asHorizontalJustification,
  asVerticalJustification,
  nearestVtColorIndex,
} from '../domain/isobus';
import type { EditorObject, ProjectState } from '../domain/types';
import { asPictureGraphicFormat, clearUnsupportedPictureGraphicOptions, derivedPictureGraphicHeight } from '../domain/vtPalette';

export const storageKey = 'isobus-iop-editor-project';

function loadProject(): ProjectState {
  try {
    const stored = window.localStorage.getItem(storageKey);
    return stored ? migrateProject(JSON.parse(stored) as ProjectState) : initialProject;
  } catch {
    return initialProject;
  }
}

function migrateProject(project: ProjectState): ProjectState {
  return {
    ...project,
    objects: project.objects.map(migrateObject),
  };
}

function migrateObject(object: EditorObject): EditorObject {
  const backgroundColorIndex = object.backgroundColorIndex ?? backgroundColorToIndex(object.backgroundColor);

  if (object.kind === 'picture-graphic') {
    const targetWidth = object.targetWidth ?? object.width ?? object.actualWidth ?? 64;
    const actualWidth = object.actualWidth ?? object.width ?? 64;
    const actualHeight = object.actualHeight ?? object.height ?? 64;
    const sourceImageDataUrl = object.sourceImageDataUrl ?? legacyImageDataUrl(object.rawData);
    const rawData = sourceImageDataUrl && !object.sourceImageDataUrl ? [] : object.rawData;

    return {
      ...object,
      backgroundColorIndex,
      targetWidth,
      width: targetWidth,
      height: derivedPictureGraphicHeight(targetWidth, actualWidth, actualHeight),
      actualWidth,
      actualHeight,
      graphicFormat: sourceImageDataUrl && !object.sourceImageDataUrl ? 2 : asPictureGraphicFormat(object.graphicFormat),
      graphicOptions: clearUnsupportedPictureGraphicOptions(object.graphicOptions ?? 0),
      rawData,
      sourceImageDataUrl,
    };
  }

  if (object.kind === 'output-string') {
    const outputOptions = object.backgroundColor === 'transparent'
      ? (object.outputOptions ?? 0) | OUTPUT_STRING_OPTION_TRANSPARENT
      : object.outputOptions ?? 0;
    const text = object.text ?? '';
    const variableReference = object.variableReference !== undefined
      ? object.variableReference
      : object.stringVariableId ? object.stringVariableId : null;
    return {
      ...object,
      backgroundColorIndex,
      length: object.length ?? Math.max(32, text.length),
      variableReference,
      stringVariableId: undefined,
      outputOptions,
      horizontalJustification: object.horizontalJustification ?? horizontalAlignToJustification(object.horizontalAlign),
      verticalJustification: object.verticalJustification ?? verticalAlignToJustification(object.verticalAlign),
      horizontalAlign: undefined,
      verticalAlign: undefined,
    };
  }

  if (object.kind === 'output-number') {
    const outputOptions = object.backgroundColor === 'transparent'
      ? (object.outputOptions ?? 0) | OUTPUT_STRING_OPTION_TRANSPARENT
      : object.outputOptions ?? 0;
    return {
      ...object,
      backgroundColorIndex,
      outputOptions,
      horizontalJustification: object.horizontalJustification ?? horizontalAlignToJustification(object.horizontalAlign),
      verticalJustification: object.verticalJustification ?? verticalAlignToJustification(object.verticalAlign),
      horizontalAlign: undefined,
      verticalAlign: undefined,
    };
  }

  return {
    ...object,
    backgroundColorIndex,
  };
}

function backgroundColorToIndex(color: string | undefined) {
  if (!color || color === 'transparent') return 1;
  return nearestVtColorIndex(color);
}

function horizontalAlignToJustification(value: EditorObject['horizontalAlign']) {
  if (value === 'center') return asHorizontalJustification(1);
  if (value === 'right') return asHorizontalJustification(2);
  return asHorizontalJustification(0);
}

function verticalAlignToJustification(value: EditorObject['verticalAlign']) {
  if (value === 'center') return asVerticalJustification(1);
  if (value === 'bottom') return asVerticalJustification(2);
  return asVerticalJustification(0);
}

function legacyImageDataUrl(rawData: number[] | undefined) {
  if (!rawData?.length) return undefined;
  const isPng = rawData[0] === 0x89 && rawData[1] === 0x50 && rawData[2] === 0x4e && rawData[3] === 0x47;
  const isJpeg = rawData[0] === 0xff && rawData[1] === 0xd8;
  const isGif = rawData[0] === 0x47 && rawData[1] === 0x49 && rawData[2] === 0x46;
  const isBmp = rawData[0] === 0x42 && rawData[1] === 0x4d;
  if (!isPng && !isJpeg && !isGif && !isBmp) return undefined;

  const bytes = new Uint8Array(rawData);
  let binary = '';
  const chunk = 8192;
  for (let index = 0; index < bytes.length; index += chunk) {
    binary += String.fromCharCode(...(bytes.subarray(index, index + chunk) as unknown as number[]));
  }

  const mime = isJpeg ? 'image/jpeg' : isGif ? 'image/gif' : isBmp ? 'image/bmp' : 'image/png';
  return `data:${mime};base64,${btoa(binary)}`;
}

export function useProjectState() {
  const [project, setProject] = useState<ProjectState>(loadProject);
  const [past, setPast] = useState<ProjectState[]>([]);
  const [future, setFuture] = useState<ProjectState[]>([]);

  const commit = useCallback((updater: (project: ProjectState) => ProjectState) => {
    setProject((current) => {
      const next = updater(current);
      if (next === current) return current;
      setPast((items) => [...items.slice(-49), current]);
      setFuture([]);
      return next;
    });
  }, []);

  const undo = useCallback(() => {
    setPast((items) => {
      if (!items.length) return items;
      const previous = items[items.length - 1];
      setProject((current) => {
        setFuture((futureItems) => [current, ...futureItems]);
        return previous;
      });
      return items.slice(0, -1);
    });
  }, []);

  const redo = useCallback(() => {
    setFuture((items) => {
      if (!items.length) return items;
      const [next, ...rest] = items;
      setProject((current) => {
        setPast((pastItems) => [...pastItems, current]);
        return next;
      });
      return rest;
    });
  }, []);

  return { project, setProject, commit, undo, redo, canUndo: past.length > 0, canRedo: future.length > 0 };
}
