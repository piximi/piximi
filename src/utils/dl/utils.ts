import { random as _random } from "lodash";

import type {
  ShapeArray,
  Shape,
  BBox,
  ExtendedAnnotationObject,
  ExtendedChannel,
  ExtendedImageObject,
} from "store/dataV2/types";

import type {
  ApiResult,
  ErrorCode,
  ErrorReason,
  InferenceInput,
  TrainingInput,
} from "./types";
import type { Tensor3D } from "@tensorflow/tfjs";

export const padToMatch = (
  sample: Tensor3D,
  targetDims: { width: number; height: number },
  padMode: "constant" | "reflect" | "symmetric",
  constantValue?: number,
): Tensor3D => {
  const sampleHeight = sample.shape[0];
  const sampleWidth = sample.shape[1];

  const dHeight = targetDims.height - sampleHeight;
  const dWidth = targetDims.width - sampleWidth;

  const padY: [number, number] = [0, 0];
  if (dHeight > 0) {
    padY[0] = Math.floor(dHeight / 2);
    padY[1] = Math.ceil(dHeight / 2);
  }

  const padX: [number, number] = [0, 0];
  if (dWidth > 0) {
    padX[0] = Math.floor(dWidth / 2);
    padX[1] = Math.ceil(dWidth / 2);
  }

  let padded: Tensor3D;

  if (padMode === "constant") {
    padded = sample.pad([padY, padX, [0, 0]], constantValue);
  } else if (padMode === "reflect" || padMode === "symmetric") {
    padded = sample.mirrorPad([padY, padX, [0, 0]], padMode);
  } else {
    throw new Error(`Unrecognized pad mode: ${padMode}`);
  }

  sample.dispose();
  return padded;
};

export const matchedCropPad = ({
  sampleWidth,
  sampleHeight,
  cropWidth,
  cropHeight,
  randomCrop,
  randomFunc,
}: {
  sampleWidth: number;
  sampleHeight: number;
  cropWidth: number;
  cropHeight: number;
  randomCrop: boolean;
  randomFunc?: (lower: number, upper: number, floating?: boolean) => number;
}): [number, number, number, number] => {
  // [y1, x1, y2, x2]
  const cropCoords: [number, number, number, number] = [0.0, 0.0, 1.0, 1.0];
  const random = randomFunc === undefined ? _random : randomFunc;

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

export const convertArrayToShape = (array: ShapeArray): Shape => {
  return {
    planes: array[0],
    height: array[1],
    width: array[2],
    channels: array[3],
  };
};

export function toTrainingInput(
  item: ExtendedImageObject | ExtendedAnnotationObject,
  selectedChannels?: Array<string>,
): TrainingInput {
  const region: BBox =
    "boundingBox" in item
      ? item.boundingBox
      : [0, 0, item.shape.width, item.shape.height];
  let channelsRef: ExtendedChannel[];
  if (selectedChannels)
    channelsRef = item.channelsRef.filter((ref) =>
      selectedChannels.includes(ref.channelMetaId),
    );
  else channelsRef = item.channelsRef;
  return {
    id: item.id,
    partition: item.partition,
    categoryId: item.categoryId,
    channelsRef,
    shape: item.shape,
    region,
  };
}

export function toInferenceInput(
  item: ExtendedImageObject | ExtendedAnnotationObject,
  selectedChannels?: Array<string>,
): InferenceInput {
  return toTrainingInput(item, selectedChannels);
}
export const ok = <T = void>(data?: T): ApiResult<T> =>
  (data === undefined
    ? { success: true }
    : { success: true, data }) as ApiResult<T>;

export const err = (
  code: ErrorCode,
  message: string,
  cause?: unknown,
): { success: false; reason: ErrorReason } => ({
  success: false,
  reason: { code, message, cause },
});
