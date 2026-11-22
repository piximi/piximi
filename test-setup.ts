import { vi } from "vitest";
import { createCanvas, createImageData } from "canvas";
import "fake-indexeddb/auto";

// Tests that opt into the node environment (`// @vitest-environment node`)
// have no DOM to patch.
if (typeof window !== "undefined") {
  const origCreateElem = window.document.createElement;

  const interceptCreateElem = (
    name: Parameters<typeof origCreateElem>[0],
    options: Parameters<typeof origCreateElem>[1],
  ): ReturnType<typeof origCreateElem> => {
    if (name === "canvas") {
      return createCanvas(0, 0) as unknown as ReturnType<typeof origCreateElem>;
    }
    window.document.createElement = origCreateElem;
    const rv = window.document.createElement(name, options);
    window.document.createElement = interceptCreateElem;
    return rv;
  };

  window.document.createElement = interceptCreateElem;

  class ImageData {
    constructor(data: Uint8ClampedArray, width: number, height: number) {
      return createImageData(data, width, height);
    }
  }
  // @ts-ignore - TS2339: Property 'ImageData' does not exist on type 'Window & typeof globalThis'.
  window.ImageData = ImageData;
}

// The project writer stamps `import.meta.env.VITE_APP_VERSION`, which the npm
// scripts supply from package.json but vitest does not.
vi.stubEnv("VITE_APP_VERSION", "2.0.0");
