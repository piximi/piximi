import type { Point } from "utils/types";

/**
 * Everything needed to convert between screen (canvas-relative) pixels and
 * image pixels for the ThreeStage. The image plane is centered at the world
 * origin, 1 world unit = 1 image pixel; the orthographic viewport camera's
 * `zoom`/`position` drive pan and zoom. Kept as plain data so the conversions
 * are pure and testable without a real THREE camera.
 */
export type ViewportState = {
  stageWidth: number;
  stageHeight: number;
  cameraPosX: number;
  cameraPosY: number;
  cameraZoom: number;
  imageWidth: number;
  imageHeight: number;
};

/**
 * Convert a canvas-relative pointer position (offsetX/Y = clientX - rect.left,
 * clientY - rect.top) to an image-pixel coordinate. `oob` reflects the raw
 * (unclamped) position; `point` is rounded and clamped into the image bounds.
 * Mirrors the mapping used by the channel renderer / vertex shader.
 */
export const screenToImage = (
  offsetX: number,
  offsetY: number,
  vp: ViewportState,
): { point: Point; oob: boolean } => {
  const {
    stageWidth,
    stageHeight,
    cameraPosX,
    cameraPosY,
    cameraZoom,
    imageWidth,
    imageHeight,
  } = vp;

  // Screen -> world (orthographic camera)
  const worldX = cameraPosX + (offsetX - stageWidth / 2) / cameraZoom;
  const worldY = cameraPosY - (offsetY - stageHeight / 2) / cameraZoom;

  // World -> image pixel (plane centered at origin, image origin top-left)
  const imgX = worldX + imageWidth / 2;
  const imgY = imageHeight / 2 - worldY;

  const oob = imgX < 0 || imgX >= imageWidth || imgY < 0 || imgY >= imageHeight;

  return {
    point: {
      x: Math.round(Math.max(0, Math.min(imageWidth - 1, imgX))),
      y: Math.round(Math.max(0, Math.min(imageHeight - 1, imgY))),
    },
    oob,
  };
};

/**
 * The transform that maps image-pixel coordinates to canvas-relative screen
 * pixels, for an SVG `<g transform="translate(tx,ty) scale(scale)">` overlaid
 * on the canvas. Inverse of {@link screenToImage}. Image-Y and SVG-Y both point
 * down, so no vertical flip is needed inside the SVG.
 */
export const imageToScreenTransform = (
  vp: ViewportState,
): { tx: number; ty: number; scale: number } => {
  const scale = vp.cameraZoom;
  const tx = vp.stageWidth / 2 - (vp.imageWidth / 2 + vp.cameraPosX) * scale;
  const ty = vp.stageHeight / 2 - (vp.imageHeight / 2 - vp.cameraPosY) * scale;
  return { tx, ty, scale };
};
