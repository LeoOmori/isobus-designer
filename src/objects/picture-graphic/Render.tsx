import {
  PICTURE_GRAPHIC_OPTION_FLASHING,
  derivedPictureGraphicHeight,
  pictureGraphicToDataUrl,
} from '../../domain/vtPalette';
import type { EditorObject } from '../../domain/types';

export function PictureGraphicContent({ object }: { object: EditorObject }) {
  const imgUrl = pictureGraphicToDataUrl(object);
  const targetWidth = object.targetWidth ?? object.width;
  const targetHeight = derivedPictureGraphicHeight(targetWidth, object.actualWidth ?? targetWidth, object.actualHeight ?? object.height);

  return imgUrl
    ? <img src={imgUrl} alt={object.name} draggable={false} onDragStart={(event) => event.preventDefault()} className={(object.graphicOptions ?? 0) & PICTURE_GRAPHIC_OPTION_FLASHING ? 'picture-graphic-flashing' : undefined} style={{ width: targetWidth, height: targetHeight, objectFit: 'fill', userSelect: 'none', imageRendering: 'pixelated' }} />
    : <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#9ca3af', fontSize: 11 }}>🖼 {object.name}</div>;
}
