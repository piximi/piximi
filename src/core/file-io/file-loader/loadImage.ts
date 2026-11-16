import { CancelSource } from "core/dl/cancel";

import { getReader } from "./readers";
import {
  applyDimensionsToStack,
  experimentFromStack,
} from "./imageReaderUtils";

import type { BitDepth } from "image-js-latest";

import type { Token } from "core/dl/cancel";

import type {
  ImportImageInput,
  LoadAndPrepareOutput,
  ReadStage,
} from "./types";

export async function loadImage(
  input: ImportImageInput,
  cancelToken: Token,
  onProgress: ({ value, stage }: { value: number; stage: ReadStage }) => void,
  requiredChannels?: number,
): Promise<LoadAndPrepareOutput> {
  const reader = getReader(input.mimeType);

  onProgress({ stage: "extract", value: 0 });
  const { stack, shape, dimConfig } = await reader.extract(input);
  if (requiredChannels && shape.channels !== requiredChannels)
    throw new Error(
      `Image channel must match existing images (${requiredChannels}-channels)`,
    );
  onProgress({ stage: "extract", value: 1 });
  await CancelSource.throwIfSignaled(cancelToken);

  const imageSeriesMap = applyDimensionsToStack(stack, dimConfig);
  onProgress({ stage: "toDims", value: 1 });
  await CancelSource.throwIfSignaled(cancelToken);
  const { imageSeries, images, planes, channels, channelMetas } =
    experimentFromStack(
      imageSeriesMap,
      {
        fileName: input.fileName,
        shape,
        bitDepth: stack.bitDepth as BitDepth, // cast needed since Stack.bitDepth typed as fast-png's BitDepth instead of image-js's own BitDepth
      },
      onProgress,
    );
  onProgress({ stage: "toExperiment", value: 1 });
  return { imageSeries, images, planes, channels, channelMetas };
}
