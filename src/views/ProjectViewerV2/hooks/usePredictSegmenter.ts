import { useCallback, useMemo } from "react";

import { useDispatch, useSelector } from "react-redux";

import { intersection } from "lodash";

import { selectAllImages, selectAllKinds } from "store/data/selectors";
import {
  selectActiveSelectedItems,
  selectSelectedImages,
} from "@ProjectViewer/state/reselectors";
import type { AnnotationObject, Category, Shape } from "store/data/types";
import { applicationSettingsSlice } from "store/applicationSettings";
import {
  selectSegmenterInferenceOptions,
  selectSegmenterModelV2,
} from "store/segmenter/selectors";
import { dataSlice } from "store/data";
import {
  UNKNOWN_NAME,
  UNKNOWN_IMAGE_CATEGORY_COLOR,
} from "store/dataV2/constants";
import { selectExtendedImages } from "store/dataV2/selectors";

import { ModelStatus } from "utils/modelsV2/enums";
import type { OrphanedAnnotationObject } from "utils/modelsV2/segmentation";
import { toInferenceInput } from "utils/modelsV2/utils";
import { getStackTraceFromError } from "utils/logUtils";
import { AlertType } from "utils/enums";
import type { AlertState, LoadCB } from "utils/types";

import { useSegmenterStatus } from "../contexts/SegmenterStatusProvider";

export const usePredictSegmenter = () => {
  const dispatch = useDispatch();
  const selectedModel = useSelector(selectSegmenterModelV2);
  const allImages = useSelector(selectExtendedImages);
  const selectedImages = useSelector(selectSelectedImages);
  const fitOptions = useSelector(selectSegmenterInferenceOptions);
  const kinds = useSelector(selectAllKinds);
  const { setModelStatus } = useSegmenterStatus();

  const handleError = useCallback(
    async (error: Error, name: string) => {
      const stackTrace = await getStackTraceFromError(error);
      const alertState: AlertState = {
        alertType: AlertType.Error,
        name: name,
        description: `${error.name}:\n${error.message}`,
        stackTrace: stackTrace,
      };
      if (import.meta.env.NODE_ENV !== "production") {
        console.error(
          alertState.name,
          "\n",
          alertState.description,
          "\n",
          alertState.stackTrace,
        );
      }
      dispatch(
        applicationSettingsSlice.actions.updateAlertState({
          alertState: alertState,
        }),
      );
      setModelStatus(ModelStatus.Idle);
    },
    [dispatch],
  );

  const predictSegmenter = useCallback(async () => {
    if (!selectedModel) return;
    const images = selectedImages.length > 0 ? selectedImages : allImages;

    // TODO: determine how to go about resegmenting images and duplicating annotations
    const inferenceImages = images;

    if (inferenceImages.length === 0) {
      await handleError(
        new Error("Inference set is empty"),
        `There are no images to segment.`,
      );

      return;
    }

    /* PREDICT */
    setModelStatus(ModelStatus.Predicting);

    try {
      selectedModel.loadInference(inferenceImages.map(toInferenceInput), {
        kinds: undefined,
        fitOptions,
      });
    } catch (error) {
      await handleError(
        error as Error,
        "Error in processing the inference data.",
      );
      return;
    }

    const progressCb: LoadCB = (
      progressPercent: number,
      progressMessage: string,
    ) => {
      dispatch(
        applicationSettingsSlice.actions.setLoadPercent({
          loadPercent: progressPercent,
          loadMessage: progressMessage,
        }),
      );
    };

    progressCb(-1, "starting inference...");

    let predictedAnnotations: OrphanedAnnotationObject[][];
    try {
      predictedAnnotations = await selectedModel.predict(progressCb);
      for (let i = 0; i < predictedAnnotations.length; i++) {
        for (let j = 0; j < predictedAnnotations[i].length; j++) {
          const bbox = predictedAnnotations[i][j].boundingBox;
          let xDiff = 0;
          let yDiff = 0;

          if (bbox[0] < 0) {
            xDiff = Math.abs(bbox[0]);
          }
          if (bbox[1] < 0) {
            yDiff = Math.abs(bbox[1]);
          }
          predictedAnnotations[i][j].boundingBox = [
            bbox[0] + xDiff,
            bbox[1] + yDiff,
            bbox[2] + xDiff,
            bbox[3] + yDiff,
          ];
        }
      }
    } catch (error) {
      await handleError(error as Error, "Error in running predictions");
      progressCb(1, "");
      return;
    }

    try {
      const uniquePredictedKinds = [
        ...new Set(
          predictedAnnotations.flatMap((imAnns) =>
            imAnns.map((ann) => ann.kind as string),
          ),
        ),
      ];

      const generatedKinds = selectedModel.inferenceKindsById([
        ...kinds.map((kind) => kind.id),
        ...uniquePredictedKinds,
      ]);
      dispatch(
        dataSlice.actions.addKinds({
          kinds: generatedKinds,
        }),
      );

      const newUnknownCategories = generatedKinds.map((kind) => {
        return {
          id: kind.unknownCategoryId,
          name: UNKNOWN_NAME,
          color: UNKNOWN_IMAGE_CATEGORY_COLOR,
          containing: [],
          kind: kind.id,
          visible: true,
        } as Category;
      });
      dispatch(
        dataSlice.actions.addCategories({
          categories: newUnknownCategories,
        }),
      );

      const annotations: AnnotationObject[] = [];
      for await (const [i, _annotations] of predictedAnnotations.entries()) {
        const image = inferenceImages[i];

        for (let j = 0; j < _annotations.length; j++) {
          const ann = _annotations[j] as Partial<AnnotationObject>;
          const bbox = ann.boundingBox!;
          const width = bbox[2] - bbox[0];
          const height = bbox[3] - bbox[1];

          if (bbox[1] + height > image.shape.height) {
            continue;
          }

          const shape: Shape = {
            planes: 1,
            channels: image.shape.channels,
            width,
            height,
          };

          ann.shape = shape;
          ann.name = `${image.name}-${ann.kind}_${j}`;
          ann.imageId = image.id;
          ann.bitDepth = image.bitDepth;
          annotations.push(ann as AnnotationObject);
        }
      }
      dispatch(dataSlice.actions.addThings({ things: annotations }));
    } catch (error) {
      await handleError(
        error as Error,
        "Error converting predictions to Piximi types",
      );
      progressCb(1, "");

      return;
    }

    progressCb(1, "");
    setModelStatus(ModelStatus.Idle);
  }, [
    handleError,
    allImages,
    selectedModel,
    selectedImages,
    fitOptions,
    kinds,
  ]);

  return predictSegmenter;
};
