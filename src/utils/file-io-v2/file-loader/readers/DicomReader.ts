import { Image as IJSImage, Stack as IJSStack } from "image-js-latest";
import { parseDicom } from "dicom-parser";
import type { IFileReader, ReaderInput, ReaderOutput } from "../types";
import { MIME } from "../types";

export const dicomReader: IFileReader = {
  supportedTypes: [MIME.DICOM],
  async extract(input: ReaderInput): Promise<ReaderOutput> {
    const imgArray = new Uint8Array(input.fileData);

    const dicomImgData = parseDicom(imgArray);
    const pixelDataElement = dicomImgData.elements.x7fe00010;

    const samplesPerPixel = dicomImgData.int16("x00280002");
    const rows = dicomImgData.int16("x00280010");
    const columns = dicomImgData.int16("x00280011");
    const bitsAllocated = dicomImgData.int16("x00280100");

    if (!samplesPerPixel || !rows || !columns || !bitsAllocated) {
      throw Error("Failed to parse dicom image tags");
    }

    let pixelData: Uint16Array | Uint8Array;
    if (bitsAllocated === 8) {
      pixelData = new Uint8Array(
        dicomImgData.byteArray.buffer,
        pixelDataElement.dataOffset,
        pixelDataElement.length,
      );
    } else if (bitsAllocated === 16) {
      pixelData = new Uint16Array(
        dicomImgData.byteArray.buffer,
        pixelDataElement.dataOffset,
        pixelDataElement.length / 2,
      );
    } else {
      throw Error("Only 8 and 16 bit images are accepted.");
    }

    const rowXCol = rows * columns;
    const dataSize = pixelData.length;
    const slices = dataSize / rowXCol;

    const images: IJSImage[] = [];
    if (Number.isInteger(slices)) {
      for (let i = 0; i < dataSize; i += rowXCol) {
        const slicePixelData = pixelData.slice(i, i + rowXCol);
        const img = new IJSImage(rows, columns, {
          data: slicePixelData,
          bitDepth: bitsAllocated,
          colorModel: "GREY",
        });
        images.push(...img.split());
      }
    } else {
      throw new Error("Could not parse dicom image slices.");
    }

    return {
      stack: new IJSStack(images),
      shape: {
        width: columns,
        height: rows,
        planes: 1,
        channels: samplesPerPixel,
      },
      dimConfig: {
        dimensionOrder: "xytzc",
        channels: samplesPerPixel,
        slices: 1,
        frames: 1,
      },
    };
  },
};
