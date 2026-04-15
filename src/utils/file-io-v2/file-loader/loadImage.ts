import { CancelToken } from "utils/worker-scheduler/types";
import type {
  ImportImageInput,
  LoadAndPrepareOutput,
  ReadStage,
} from "./types";
import { getReader } from "./readers";
import {
  applyDimensionsToStack,
  experimentFromStack,
} from "./imageReaderUtils";

export async function loadImage(
  input: ImportImageInput,
  cancelToken: CancelToken,
  onProgress: ({ value, stage }: { value: number; stage: ReadStage }) => void,
): Promise<LoadAndPrepareOutput> {
  const reader = getReader(input.mimeType);

  onProgress({ stage: "extract", value: 0 });
  const { stack, shape, dimConfig } = await reader.extract(input);
  onProgress({ stage: "extract", value: 1 });
  if (cancelToken.cancelled) {
    throw new DOMException("Task cancelled", "AbortError");
  }

  const imageSeriesMap = applyDimensionsToStack(stack, dimConfig);
  onProgress({ stage: "toDims", value: 1 });
  if (cancelToken.cancelled) {
    throw new DOMException("Task cancelled", "AbortError");
  }
  const { imageSeries, images, planes, channels, channelMetas } =
    experimentFromStack(
      imageSeriesMap,
      {
        fileName: input.fileName,
        shape,
        bitDepth: stack.bitDepth,
      },
      onProgress,
    );
  onProgress({ stage: "toExperiment", value: 1 });
  return { imageSeries, images, planes, channels, channelMetas };
}
