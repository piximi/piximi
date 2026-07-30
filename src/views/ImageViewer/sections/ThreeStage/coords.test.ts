import { describe, expect, it } from "vitest";

import { screenToImage, imageToScreenTransform } from "./coords";

import type { ViewportState } from "./coords";

// 1:1 viewport: stage and image both 100x100, no zoom, camera at origin.
const identity: ViewportState = {
  stageWidth: 100,
  stageHeight: 100,
  cameraPosX: 0,
  cameraPosY: 0,
  cameraZoom: 1,
  imageWidth: 100,
  imageHeight: 100,
};

describe("screenToImage", () => {
  it("maps the stage center to the image center", () => {
    const { point, oob } = screenToImage(50, 50, identity);
    expect(point).toEqual({ x: 50, y: 50 });
    expect(oob).toBe(false);
  });

  it("maps the top-left of the stage to image (0,0)", () => {
    const { point, oob } = screenToImage(0, 0, identity);
    expect(point).toEqual({ x: 0, y: 0 });
    expect(oob).toBe(false);
  });

  it("flags out-of-bounds and clamps when the image is smaller than the stage", () => {
    // image 50x50 centered in a 100x100 stage: top-left of the stage is
    // outside the image.
    const vp: ViewportState = { ...identity, imageWidth: 50, imageHeight: 50 };
    const { point, oob } = screenToImage(0, 0, vp);
    expect(oob).toBe(true);
    expect(point).toEqual({ x: 0, y: 0 }); // clamped into range
  });

  it("halves the screen->image delta at 2x zoom", () => {
    const vp: ViewportState = { ...identity, cameraZoom: 2 };
    // 10px right of center on screen -> 5px right of center in image
    const { point } = screenToImage(60, 50, vp);
    expect(point).toEqual({ x: 55, y: 50 });
  });

  it("offsets by the camera pan position", () => {
    const vpX: ViewportState = { ...identity, cameraPosX: 10 };
    expect(screenToImage(50, 50, vpX).point).toEqual({ x: 60, y: 50 });

    const vpY: ViewportState = { ...identity, cameraPosY: 10 };
    expect(screenToImage(50, 50, vpY).point).toEqual({ x: 50, y: 40 });
  });
});

describe("imageToScreenTransform", () => {
  it("is the identity transform for a 1:1 viewport", () => {
    expect(imageToScreenTransform(identity)).toEqual({
      tx: 0,
      ty: 0,
      scale: 1,
    });
  });

  it("round-trips with screenToImage under zoom + pan", () => {
    const vp: ViewportState = {
      stageWidth: 120,
      stageHeight: 80,
      cameraPosX: 10,
      cameraPosY: -5,
      cameraZoom: 2,
      imageWidth: 60,
      imageHeight: 40,
    };
    const { tx, ty, scale } = imageToScreenTransform(vp);

    const imgPoint = { x: 30, y: 20 };
    const screenX = imgPoint.x * scale + tx;
    const screenY = imgPoint.y * scale + ty;

    expect(screenToImage(screenX, screenY, vp).point).toEqual(imgPoint);
  });
});
