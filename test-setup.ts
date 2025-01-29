import { createCanvas, createImageData } from "canvas"

const origCreateElem = window.document.createElement;

const interceptCreateElem = (name: Parameters<typeof origCreateElem>[0], options: Parameters<typeof origCreateElem>[1] ): ReturnType<typeof origCreateElem> => {
    if (name === "canvas") {
        return createCanvas(0, 0) as unknown as ReturnType<typeof origCreateElem>;
    }
    window.document.createElement = origCreateElem;
    const rv = window.document.createElement(name, options);
    window.document.createElement = interceptCreateElem;
    return rv;
}

window.document.createElement = interceptCreateElem;

class ImageData {
    constructor(data: Uint8ClampedArray, width: number, height: number) {
        return createImageData(data, width, height);
    }
}
// @ts-ignore
window.ImageData = ImageData;
