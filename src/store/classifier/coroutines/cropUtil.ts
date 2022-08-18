import { Tensor, Rank } from "@tensorflow/tfjs";
import { random } from "lodash";

export const padToMatch = (
  sample: Tensor<Rank.R3>,
  targetDims: { width: number; height: number }
): Tensor<Rank.R3> => {
  const sampleHeight = sample.shape[0];
  const sampleWidth = sample.shape[1];

  const dHeight = targetDims.height - sampleHeight;
  const dWidth = targetDims.width - sampleWidth;

  let padY: [number, number] = [0, 0];
  if (dHeight > 0) {
    padY[0] = Math.floor(dHeight / 2);
    padY[1] = Math.ceil(dHeight / 2);
  }

  let padX: [number, number] = [0, 0];
  if (dWidth > 0) {
    padX[0] = Math.floor(dWidth / 2);
    padX[1] = Math.ceil(dWidth / 2);
  }

  const padded: Tensor<Rank.R3> = sample.pad([padY, padX, [0, 0]]);

  sample.dispose();
  return padded;
};

export const matchedCropPad = ({
  sampleWidth,
  sampleHeight,
  cropWidth,
  cropHeight,
  randomCrop,
}: {
  sampleWidth: number;
  sampleHeight: number;
  cropWidth: number;
  cropHeight: number;
  randomCrop: boolean;
}): [number, number, number, number] => {
  // [y1, x1, y2, x2]
  let cropCoords: [number, number, number, number] = [0.0, 0.0, 1.0, 1.0];

  if (sampleHeight > cropHeight) {
    const hRatio = cropHeight / sampleHeight;
    cropCoords[0] = randomCrop ? random(0, 1 - hRatio) : (1 - hRatio) / 2; // y1 in Random(0, hRatio) or center
    cropCoords[2] = cropCoords[0] + hRatio; // y2 = y1 + hRatio
  }

  if (sampleWidth > cropWidth) {
    const wRatio = cropWidth / sampleWidth;
    cropCoords[1] = randomCrop ? random(0, 1 - wRatio) : (1 - wRatio) / 2; // x1 in Random(0, wRatio) or center
    cropCoords[3] = cropCoords[1] + wRatio; // x2 = x1 + wRatio
  }

  return cropCoords;
};
