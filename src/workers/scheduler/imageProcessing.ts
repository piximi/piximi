/**
 * Image processing utilities that run inside Web Workers
 *
 * These functions use image-js for decoding and basic processing.
 * TensorFlow.js is used for tensor creation.
 *
 * IMPORTANT: This file is bundled into the worker, not the main thread.
 */

import { Image as IJSImage, Stack as IJSStack } from "image-js";
import { Tensor3D, tensor4d, Tensor4D, tidy } from "@tensorflow/tfjs";
import { ColorsRaw } from "utils/types";
import { forceStack, getImageInformation } from "utils/file-io/utils";
import { ImageShapeInfo } from "utils/file-io/types";
import {
  createColorsTensor,
  filterVisibleChannels,
  generateColoredTensor,
  getImageSlice,
  renderTensor,
  scaleImageTensor,
  sliceVisibleChannels,
  sliceVisibleColors,
} from "utils/tensorUtils";

// ============================================================
// Image Loading
// ============================================================

/**
 * Load image from ArrayBuffer
 * Returns an image-js Stack (even for single images)
 */
export async function loadImageFromBuffer(
  buffer: ArrayBuffer,
): Promise<ImageShapeInfo & { stack: IJSStack }> {
  const image = await IJSImage.load(buffer, {
    ignorePalette: true,
  });

  const imageInfo = getImageInformation(image);
  const stack = await forceStack(image);
  return {
    ...imageInfo,
    stack,
  };
}

/**
 * Convert image-js Stack to Tensor4D
 * Shape: [planes, height, width, channels]
 */
export function stackToTensor(
  stack: IJSStack,
  planes: number,
  channels: number,
  targetDtype: "float32" | "int32" = "float32",
): {
  tensor: Tensor4D;
  shape: [number, number, number, number];
  bitDepth: number;
} {
  const { width, height, bitDepth } = stack[0];

  // Calculate total size
  const totalSize = planes * height * width * channels;

  // Create typed array
  const data =
    targetDtype === "float32"
      ? new Float32Array(totalSize)
      : new Uint8Array(totalSize);

  // Fill data in [Z, H, W, C] order
  let offset = 0;
  for (let z = 0; z < planes; z++) {
    const plane = stack[z];
    const planeData = plane.data;

    for (let h = 0; h < height; h++) {
      for (let w = 0; w < width; w++) {
        for (let c = 0; c < channels; c++) {
          const srcIdx = (h * width + w) * channels + c;

          if (targetDtype === "float32") {
            // Normalize to 0-1 range based on bit depth
            const maxVal = plane.bitDepth === 16 ? 65535 : 255;
            data[offset] = planeData[srcIdx] / maxVal;
          } else {
            data[offset] = planeData[srcIdx];
          }
          offset++;
        }
      }
    }
  }

  const shape: [number, number, number, number] = [
    planes,
    height,
    width,
    channels,
  ];

  const tensor = tensor4d(data, shape, targetDtype);

  return { tensor, shape, bitDepth };
}

/**
 * Extract tensor data as ArrayBuffer
 */
export function tensorToBuffer(tensor: Tensor4D): {
  buffer: ArrayBuffer;
  dtype: "float32" | "int32" | "uint8";
} {
  const data = tensor.dataSync();

  let dtype: "float32" | "int32" | "uint8";
  if (data instanceof Float32Array) {
    dtype = "float32";
  } else if (data instanceof Int32Array) {
    dtype = "int32";
  } else {
    dtype = "uint8";
  }

  // Clone the buffer (dataSync returns a view)
  const buffer = data.buffer.slice(0) as ArrayBuffer;

  return { buffer, dtype };
}

// ============================================================
// Color Generation
// ============================================================

// ============================================================
// Rendering
// ============================================================

/**
 * Render tensor to data URL for preview
 * Uses a single plane and maps channels to RGB
 */
export async function renderPreview(
  tensor: Tensor4D,
  colors: ColorsRaw,
  plane: number = 0,
  bitDepth: number,
  channels: number,
): Promise<string> {
  const compositeImage = tidy(() => {
    let operandTensor: Tensor4D | Tensor3D;
    let disposeOperandTensor: boolean;

    if (plane === undefined) {
      operandTensor = tensor;
      disposeOperandTensor = false;
    } else {
      // image slice := get z idx 0 of image with dims: [H, W, C]
      operandTensor = getImageSlice(tensor, plane);
      disposeOperandTensor = true;
    }

    const colorTensor = createColorsTensor(colors, channels);

    // scale each channel by its range
    const scaledImageSlice = scaleImageTensor(operandTensor, colorTensor, {
      disposeImageTensor: disposeOperandTensor,
    });

    // get indices of visible channels, VC
    const visibleChannels = filterVisibleChannels(colorTensor);

    // image slice filtered by visible channels: [H, W, VC] or [Z, H, W, VC]
    const filteredSlice = sliceVisibleChannels(
      scaledImageSlice,
      visibleChannels,
    );

    // color matrix filtered by visible channels: [VC, 3]
    const filteredColors = sliceVisibleColors(colorTensor, visibleChannels);

    // composite image slice: [H, W, 3] or [Z, H, W, 3]
    const compositeImage = generateColoredTensor(filteredSlice, filteredColors);

    return compositeImage;
  });

  const src = await renderTensor(compositeImage, bitDepth, {
    disposeCompositeTensor: true,
    useCanvas: false,
  });

  return Array.isArray(src) ? src[0] : src;
  // const [planes, height, width, channels] = tensor.shape;
  // const data = tensor.dataSync();

  // // Create canvas
  // const canvas = new OffscreenCanvas(width, height);
  // const ctx = canvas.getContext("2d")!;
  // const imageData = ctx.createImageData(width, height);

  // const planeOffset = plane * height * width * channels;

  // for (let h = 0; h < height; h++) {
  //   for (let w = 0; w < width; w++) {
  //     const srcIdx = planeOffset + (h * width + w) * channels;
  //     const dstIdx = (h * width + w) * 4;

  //     if (channels >= 3) {
  //       // RGB or more - use first 3 channels
  //       imageData.data[dstIdx] = Math.round(data[srcIdx] * 255);
  //       imageData.data[dstIdx + 1] = Math.round(data[srcIdx + 1] * 255);
  //       imageData.data[dstIdx + 2] = Math.round(data[srcIdx + 2] * 255);
  //     } else {
  //       // Grayscale - repeat across RGB
  //       const val = Math.round(data[srcIdx] * 255);
  //       imageData.data[dstIdx] = val;
  //       imageData.data[dstIdx + 1] = val;
  //       imageData.data[dstIdx + 2] = val;
  //     }
  //     imageData.data[dstIdx + 3] = 255; // Alpha
  //   }
  // }

  // ctx.putImageData(imageData, 0, 0);

  // const blob = await canvas.convertToBlob({ type: "image/png" });
  // const reader = new FileReader();
  // return new Promise<string>((resolve) => {
  //   reader.onloadend = () => resolve(reader.result as string);
  //   reader.readAsDataURL(blob);
  // });
}

// ============================================================
// Channel Preparation
// ============================================================

/**
 * Prepare channel data for measurements
 * Extracts per-channel pixel arrays
 */
export function prepareChannels(tensor: Tensor4D): {
  data: number[][];
  histograms: number[][];
} {
  const [planes, height, width, channels] = tensor.shape;
  const rawData = tensor.dataSync();

  const channelData: number[][] = [];
  const histograms: number[][] = [];

  for (let c = 0; c < channels; c++) {
    const pixels: number[] = [];
    const histogram = new Array(256).fill(0);

    // Extract all pixels for this channel across all planes
    for (let z = 0; z < planes; z++) {
      for (let h = 0; h < height; h++) {
        for (let w = 0; w < width; w++) {
          const idx =
            z * (height * width * channels) +
            h * (width * channels) +
            w * channels +
            c;
          const val = rawData[idx];
          pixels.push(val);

          // Build histogram (assuming normalized 0-1 values)
          const bin = Math.min(255, Math.floor(val * 256));
          histogram[bin]++;
        }
      }
    }

    channelData.push(pixels);
    histograms.push(histogram);
  }

  return { data: channelData, histograms };
}
