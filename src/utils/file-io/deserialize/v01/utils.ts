import { dispose, Tensor3D, Tensor4D, tidy } from "@tensorflow/tfjs";
import { BitDepth } from "store/data/types";
import {
  filterVisibleChannels,
  generateColoredTensor,
  getImageSlice,
  renderTensor,
  scaleImageTensor,
  sliceVisibleChannels,
  sliceVisibleColors,
} from "utils/tensorUtils";
import { Colors } from "utils/types";

/*
  Receives a tensor of shape [Z, H, W, C], colors to apply, and a bitDepth,
  applies the colors generating a [H, W, 3] tensor,
  and returns the corresponding data url
 */
export async function v01CreateRenderedTensor<T extends number | undefined>(
  imageTensor: Tensor4D,
  colors: Colors,
  bitDepth: BitDepth,
  plane: T,
): Promise<T extends number ? string : string[]>;

export async function v01CreateRenderedTensor(
  imageTensor: Tensor4D,
  colors: Colors,
  bitDepth: BitDepth,
  plane: number | undefined,
) {
  const compositeImage = tidy(() => {
    let operandTensor: Tensor4D | Tensor3D;
    let disposeOperandTensor: boolean;

    if (plane === undefined) {
      operandTensor = imageTensor;
      disposeOperandTensor = false;
    } else {
      // image slice := get z idx 0 of image with dims: [H, W, C]
      operandTensor = getImageSlice(imageTensor, plane);
      disposeOperandTensor = true;
    }

    // scale each channel by its range
    const scaledImageSlice = scaleImageTensor(operandTensor, colors, {
      disposeImageTensor: disposeOperandTensor,
    });

    // get indices of visible channels, VC
    const visibleChannels = filterVisibleChannels(colors);

    // image slice filtered by visible channels: [H, W, VC] or [Z, H, W, VC]
    const filteredSlice = sliceVisibleChannels(
      scaledImageSlice,
      visibleChannels,
    );

    // color matrix filtered by visible channels: [VC, 3]
    const filteredColors = sliceVisibleColors(colors, visibleChannels);

    // composite image slice: [H, W, 3] or [Z, H, W, 3]
    const compositeImage = generateColoredTensor(filteredSlice, filteredColors);

    return compositeImage;
  });
  const src = await renderTensor(compositeImage, bitDepth);

  dispose(compositeImage);

  return src;
}
