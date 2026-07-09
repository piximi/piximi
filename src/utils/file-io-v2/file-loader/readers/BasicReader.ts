import {
  decodeJpeg,
  decodePng,
  Stack as IJSStack,
  Image as IJSImage,
} from "image-js-latest";
import libheif from "libheif-js/wasm-bundle";

import { MIME } from "../types";

import type { IFileReader, ReaderInput, ReaderOutput } from "../types";

export const basicReader: IFileReader = {
  supportedTypes: [MIME.PNG, MIME.JPEG, MIME.HEIC],
  async extract(input: ReaderInput): Promise<ReaderOutput> {
    let image: IJSImage;
    const imageData = new Uint8Array(input.fileData);
    if (input.mimeType === MIME.JPEG) {
      image = decodeJpeg(imageData);
    } else if (input.mimeType === MIME.PNG) {
      image = decodePng(imageData);
    } else {
      const decoder = new libheif.HeifDecoder();
      const decoded = decoder.decode(imageData); // imageData = new Uint8Array(input.fileData)
      if (!decoded.length)
        throw new Error(`No image found in HEIC: ${input.fileName}`);

      const heifImage = decoded[0];
      const width = heifImage.get_width();
      const height = heifImage.get_height();

      const rgba = new Uint8ClampedArray(width * height * 4);
      await new Promise<void>((resolve, reject) => {
        heifImage.display({ data: rgba, width, height }, (displayData) => {
          if (!displayData)
            reject(new Error(`HEIC decode failed: ${input.fileName}`));
          else resolve();
        });
      });

      image = new IJSImage(width, height, {
        data: new Uint8Array(rgba.buffer),
        colorModel: "RGBA",
      });
    }

    if (image.alpha)
      image = image.convertColor(image.colorModel === "GREY" ? "GREY" : "RGB");

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
