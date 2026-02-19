import { useCallback, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { tensor4d } from "@tensorflow/tfjs";

import { useDataPipeline } from "contexts/DataPipelineProvider";

import { dataSlice } from "store/data";
import { IMAGE_KIND } from "store/data/constants";
import { selectUnknownImageCategory } from "store/data/selectors";
import { ImageObject, ImageMetadata, Shape } from "store/data/types";
import { generateUUID } from "store/data/utils";
import { selectActiveCategory } from "store/project/selectors";
import { applicationSettingsSlice } from "store/applicationSettings";

import {
  PipelineResult,
  UploadOptions,
  UploadOptionswithCallbacks,
} from "services/dataPipeline/types";

import { AlertType } from "utils/enums";
import { Partition } from "utils/models/enums";
import { isUnknownCategory } from "store/data/utils";

type UseUploadPipelineReturn = {
  upload: (
    files: FileList,
    options?: UploadOptionswithCallbacks,
  ) => Promise<PipelineResult>;
  isUploading: boolean;
};

/**
 * Hook that orchestrates the upload pipeline
 *
 * Calls DataPipelineService for worker-based processing,
 * then dispatches the results to Redux
 */
export function useUploadPipeline(): UseUploadPipelineReturn {
  const dispatch = useDispatch();
  const pipeline = useDataPipeline();
  const selectedCategory = useSelector(selectActiveCategory);
  const unknownCategory = useSelector(selectUnknownImageCategory);
  const [isUploading, setIsUploading] = useState(false);

  const upload = useCallback(
    async (
      files: FileList,
      options?: UploadOptionswithCallbacks,
    ): Promise<PipelineResult> => {
      setIsUploading(true);

      try {
        // 1. Run the pipeline (workers + IndexDB)
        const result = await pipeline.uploadFiles(files, options);

        if (!result.success || result.images.length === 0) {
          if (result.errors.length > 0) {
            dispatch(
              applicationSettingsSlice.actions.updateAlertState({
                alertState: {
                  alertType: AlertType.Error,
                  name: "File Upload Error",
                  description: result.errors
                    .map((e) => `${e.fileName} -- ${e.error.message}`)
                    .join("\n---\n"),
                },
              }),
            );
          }
          return result;
        }

        // 2. Build Redux payload from pipeline results
        const generatedMetadataObjects = buildReduxPayload(
          result,
          options,
          selectedCategory,
          unknownCategory,
        );

        // 3. Dispatch to Redux
        dispatch(dataSlice.actions.batchAddMetadata(generatedMetadataObjects));

        // 4. Report errors if any
        if (result.errors.length > 0) {
          dispatch(
            applicationSettingsSlice.actions.updateAlertState({
              alertState: {
                alertType: AlertType.Warning,
                name: "Some files failed",
                description: result.warnings.join("\n"),
              },
            }),
          );
        }

        return result;
      } finally {
        setIsUploading(false);
      }
    },
    [dispatch, pipeline, selectedCategory, unknownCategory],
  );

  return { upload, isUploading };
}

/**
 * Converts PipelineResult into the format expected by
 * dataSlice.actions.batchAddMetadata()
 *
 * Maps result.images (array of { imageId, fileName, tensorRef }) into
 * hierarchical { metadata, images[] } structure for Redux.
 *
 * Handles two modes:
 *   - Normal: each file → its own { metadata, images: [image] }
 *   - Time series: all files → single { metadata, images: [...all] }
 */
function buildReduxPayload(
  result: PipelineResult,
  options: UploadOptions | undefined,
  selectedCategory: string | undefined,
  unknownCategory: string,
): Array<{ metadata: ImageMetadata; images: ImageObject[] }> {
  const timeSeries = options?.timeSeries ?? false;

  const timeSeriesMetadata: ImageMetadata = {
    name: result.images[0].fileName,
    id: generateUUID(),
    kind: IMAGE_KIND,
    shape: getShapeFromArray(result.images[0].tensorRef.shape),
    bitDepth: 8,
    timeSeries: true,
    imageDataIds: result.images.map((i) => i.imageId),
    defaultImageId: result.images[0].imageId,
  };

  const timeSeriesMetadataEntry: {
    metadata: ImageMetadata;
    images: ImageObject[];
  } = {
    metadata: timeSeriesMetadata,
    images: [],
  };

  const metadataMap = new Map<
    string,
    { metadata: ImageMetadata; images: ImageObject[] }
  >();
  metadataMap.set(timeSeriesMetadata.id, {
    metadata: timeSeriesMetadata,
    images: [],
  });

  const singleFrameMetadataEntries: Array<{
    metadata: ImageMetadata;
    images: ImageObject[];
  }> = [];
  for (let i = 0; i < result.images.length; i++) {
    const image = result.images[i];
    let metadataEntry: { metadata: ImageMetadata; images: ImageObject[] };

    if (!timeSeries) {
      const metadata: ImageMetadata = {
        name: image.fileName,
        id: generateUUID(),
        kind: IMAGE_KIND,
        shape: getShapeFromArray(image.tensorRef.shape),
        bitDepth: 8,
        timeSeries: false,
        imageDataIds: [image.imageId],
        defaultImageId: image.imageId,
      };
      metadataEntry = { metadata, images: [] };
      singleFrameMetadataEntries.push(metadataEntry);
    } else {
      metadataEntry = timeSeriesMetadataEntry;
    }

    const imageObject: ImageObject = {
      id: image.imageId,
      name: `${image.fileName}${timeSeries ? "_data_" + i : ""}`,
      partition:
        !selectedCategory ||
        (selectedCategory && isUnknownCategory(selectedCategory))
          ? Partition.Inference
          : Partition.Unassigned,
      categoryId: selectedCategory ?? unknownCategory,
      activePlane: 0,
      timepoint: timeSeries ? i : undefined,
      src: "",
      colors: {
        color: [[0, 0, 0]],
        range: { 0: [0, 0] },
        visible: { 0: false },
      },
      data: tensor4d([[[[0], [0], [0]]]]),
      metadataId: metadataEntry.metadata.id,
      tensorRef: image.tensorRef,
    };
    metadataEntry.images.push(imageObject);
  }
  if (timeSeries) {
    return [timeSeriesMetadataEntry];
  }
  return singleFrameMetadataEntries;
}

const getShapeFromArray = (arr: [number, number, number, number]) => {
  return {
    planes: arr[0],
    height: arr[1],
    width: arr[2],
    channels: arr[3],
  } as Shape;
};
