import type { CSSProperties, ReactNode } from 'react';
import {
  OUTPUT_NUMBER_OPTION_TRANSPARENT,
  OUTPUT_STRING_OPTION_AUTO_WRAP,
  OUTPUT_STRING_OPTION_TRANSPARENT,
  OUTPUT_STRING_OPTION_WRAP_ON_HYPHEN,
  horizontalJustificationToFlex,
  verticalJustificationToFlex,
  vtColor,
} from '../domain/isobus';
import type { EditorObject, ObjectKind, ProjectState } from '../domain/types';
import { ButtonContent, buttonFrameStyle } from './button';
import { ContainerContent, containerFrameStyle } from './container';
import { InputBooleanContent } from './input-boolean';
import { InputStringContent } from './input-string';
import { InputNumberContent } from './input-number';
import { InputListContent } from './input-list';
import { KeyContent } from './key';
import { OutputNumberContent } from './output-number';
import { outputRectangleStyle } from './output-rectangle/logic';
import { OutputStringContent } from './output-string';
import { PictureGraphicContent } from './picture-graphic';

export type CanvasRenderContext = {
  project: ProjectState;
  objectById: Map<string, EditorObject>;
  editingTextObjectId: string | null;
  isSelected: boolean;
  clipDisabled: boolean;
  onPatch: (id: string, changes: Partial<EditorObject>) => void;
  onEndEditing: () => void;
  renderChildren: (object: EditorObject) => ReactNode;
};

export type CanvasObjectRenderer = {
  isRenderable?: (object: EditorObject) => boolean;
  frameStyle: (object: EditorObject, context: CanvasRenderContext) => CSSProperties;
  renderContent?: (object: EditorObject, context: CanvasRenderContext) => ReactNode;
};

export const canvasObjectRenderers: Partial<Record<ObjectKind, CanvasObjectRenderer>> = {
  'container': {
    isRenderable: (object) => !object.hidden,
    frameStyle: () => containerFrameStyle(),
    renderContent: (object, context) => (
      <ContainerContent object={object} clipDisabled={context.clipDisabled}>{context.renderChildren(object)}</ContainerContent>
    ),
  },
  'button': {
    frameStyle: (object) => buttonFrameStyle(object),
    renderContent: (object, context) => (
      <ButtonContent object={object} clipDisabled={context.clipDisabled}>{context.renderChildren(object)}</ButtonContent>
    ),
  },
  'key': {
    frameStyle: () => defaultFrameStyle(),
    renderContent: (object, context) => <KeyContent clipDisabled={context.clipDisabled}>{context.renderChildren(object)}</KeyContent>,
  },
  'output-string': {
    frameStyle: (object, context) => outputTextFrameStyle(object, context, OUTPUT_STRING_OPTION_TRANSPARENT),
    renderContent: (object, context) => {
      const font = context.objectById.get(object.fontAttributeId ?? '');
      const variableReference = object.variableReference !== undefined ? object.variableReference : object.stringVariableId || null;
      const stringVariable = variableReference ? context.objectById.get(variableReference) : undefined;
      return (
        <OutputStringContent
          object={object}
          font={font}
          stringVariable={stringVariable}
          isEditing={context.editingTextObjectId === object.id}
          onPatch={(changes) => context.onPatch(object.id, changes)}
          onEndEditing={context.onEndEditing}
        />
      );
    },
  },
  'output-number': {
    frameStyle: (object, context) => outputTextFrameStyle(object, context, OUTPUT_NUMBER_OPTION_TRANSPARENT),
    renderContent: (object, context) => {
      const font = context.objectById.get(object.fontAttributeId ?? '');
      const variableReference = object.variableReference !== undefined ? object.variableReference : object.numberVariableId || null;
      const numberVariable = variableReference ? context.objectById.get(variableReference) : undefined;
      return <OutputNumberContent object={object} font={font} numberVariable={numberVariable} />;
    },
  },
  'output-rectangle': {
    frameStyle: (object, context) => {
      const line = context.objectById.get(object.lineAttributeId ?? '');
      const fill = context.objectById.get(object.fillAttributeId ?? '');
      return outputRectangleStyle(object, line, fill, context.project.objects);
    },
  },
  'picture-graphic': {
    frameStyle: () => defaultFrameStyle(),
    renderContent: (object) => <PictureGraphicContent object={object} />,
  },
  'input-boolean': {
    frameStyle: (object) => ({
      borderColor: object.borderColor,
      borderWidth: 1,
      borderStyle: 'solid',
      background: vtColor(object.backgroundColorIndex ?? 1),
    }),
    renderContent: (object, context) => {
      const fontAttr = context.objectById.get(object.fontAttributeId ?? '');
      return <InputBooleanContent object={object} fontAttr={fontAttr} />;
    },
  },
  'input-string': {
    frameStyle: (object, context) => outputTextFrameStyle(object, context, OUTPUT_STRING_OPTION_TRANSPARENT),
    renderContent: (object, context) => {
      const font = context.objectById.get(object.fontAttributeId ?? '');
      const stringVariable = object.variableReference ? context.objectById.get(object.variableReference) : undefined;
      return <InputStringContent object={object} font={font} stringVariable={stringVariable} />;
    },
  },
  'input-number': {
    frameStyle: (object, context) => outputTextFrameStyle(object, context, OUTPUT_NUMBER_OPTION_TRANSPARENT),
    renderContent: (object, context) => {
      const font = context.objectById.get(object.fontAttributeId ?? '');
      const numberVariable = object.variableReference ? context.objectById.get(object.variableReference) : undefined;
      return <InputNumberContent object={object} font={font} numberVariable={numberVariable} />;
    },
  },
  'input-list': {
    frameStyle: (object) => ({
      borderColor: object.borderColor,
      borderWidth: 1,
      borderStyle: 'solid',
      background: vtColor(object.backgroundColorIndex ?? 1),
    }),
    renderContent: (object, context) => {
      const value = object.value ?? 255;
      const listItems = object.listItems ?? [];
      const selectedId = value !== 255 ? listItems[value] : undefined;
      const selectedItem = selectedId ? context.objectById.get(selectedId) : undefined;

      return (
        <InputListContent object={object}>
          {selectedItem && (
            <div style={{ position: 'relative', width: '100%', height: '100%' }}>
              {renderCanvasObjectContent(selectedItem, { ...context, isSelected: false })}
            </div>
          )}
        </InputListContent>
      );
    },
  },
};

export function canvasObjectFrameStyle(object: EditorObject, context: CanvasRenderContext): CSSProperties {
  return canvasObjectRenderers[object.kind]?.frameStyle(object, context) ?? defaultFrameStyle(object);
}

export function renderCanvasObjectContent(object: EditorObject, context: CanvasRenderContext): ReactNode {
  return canvasObjectRenderers[object.kind]?.renderContent?.(object, context) ?? null;
}

export function isCanvasObjectRenderable(object: EditorObject): boolean {
  return canvasObjectRenderers[object.kind]?.isRenderable?.(object) ?? true;
}

export function visibleChildObjects(project: ProjectState, object: EditorObject): EditorObject[] {
  return (object.childObjectIds ?? [])
    .map((childId) => project.objects.find((candidate) => candidate.id === childId))
    .filter((candidate): candidate is EditorObject => candidate !== undefined && candidate.visible)
    .sort((a, b) => a.zIndex - b.zIndex);
}

function outputTextFrameStyle(object: EditorObject, context: CanvasRenderContext, transparentBit: number): CSSProperties {
  const font = context.objectById.get(object.fontAttributeId ?? '');
  const outputStringAutoWrap = (object.kind === 'output-string' || object.kind === 'input-string') && ((object.outputOptions ?? 0) & OUTPUT_STRING_OPTION_AUTO_WRAP) !== 0;
  const outputStringWrapOnHyphen = (object.kind === 'output-string' || object.kind === 'input-string') && ((object.outputOptions ?? 0) & OUTPUT_STRING_OPTION_WRAP_ON_HYPHEN) !== 0;

  return {
    borderColor: object.borderColor,
    borderWidth: 1,
    borderStyle: 'solid',
    background: ((object.outputOptions ?? 0) & transparentBit) !== 0 ? 'transparent' : vtColor(object.backgroundColorIndex ?? 1),
    fontSize: (object.kind === 'output-string' || object.kind === 'input-string')
      ? (font?.fontHeight ?? font?.fontSize ?? object.fontSize)
      : (font?.fontHeight ?? font?.fontSize ?? 16),
    fontFamily: font?.proportional === false ? 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace' : undefined,
    color: vtColor(font?.fontColor ?? 0),
    fontWeight: (font?.fontStyle ?? 0) & 1 ? 700 : undefined,
    fontStyle: (font?.fontStyle ?? 0) & 2 ? 'italic' : undefined,
    textDecoration: (font?.fontStyle ?? 0) & 4 ? 'underline' : undefined,
    justifyContent: horizontalJustificationToFlex(object.horizontalJustification),
    alignItems: verticalJustificationToFlex(object.verticalJustification),
    whiteSpace: outputStringAutoWrap ? 'pre-wrap' : 'nowrap',
    overflowWrap: outputStringAutoWrap ? (outputStringWrapOnHyphen ? 'break-word' : 'normal') : undefined,
    wordBreak: outputStringAutoWrap ? 'normal' : undefined,
    hyphens: outputStringAutoWrap && outputStringWrapOnHyphen ? 'manual' : 'none',
  };
}

function defaultFrameStyle(object?: EditorObject): CSSProperties {
  return {
    borderColor: object?.borderColor,
    borderWidth: 1,
    borderStyle: 'solid',
    background: object?.backgroundColor,
  };
}
