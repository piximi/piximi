import { decodeJpeg, decodePng, Stack as IJSStack } from "image-js-latest";

import { MIME } from "../types";

import type { Image as IJSImage } from "image-js-latest";
import type { IFileReader, ReaderInput, ReaderOutput } from "../types";

export const basicReader: IFileReader = {
  supportedTypes: [MIME.PNG, MIME.JPEG],
  async extract(input: ReaderInput): Promise<ReaderOutput> {
    let image: IJSImage;
    const imageData = new Uint8Array(input.fileData);
    if (input.mimeType === MIME.JPEG) {
      image = decodeJpeg(imageData);
    } else {
      image = decodePng(imageData);
    }

    const shape = {
      planes: 1,
      channels: image.channels,
      width: image.width,
      height: image.height,
    };

    return {
      stack: new IJSStack([...image.split()]),
      shape,
      dimConfig: {
        dimensionOrder: "xytzc",
        channels: shape.channels,
        slices: shape.planes,
        frames: 1,
      },
    };
  },
};
