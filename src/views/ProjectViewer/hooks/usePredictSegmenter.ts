import { useCallback } from "react";

import { batch, useDispatch, useSelector } from "react-redux";

import { selectAllKinds, selectExtendedImages } from "store/dataV2/selectors";
import { selectSelectedImages } from "@ProjectViewer/state/reselectors";
import { applicationSettingsSlice } from "store/applicationSettings";
import type {
  AnnotationCategory,
  AnnotationObject,
  AnnotationVolume,
  Kind,
  Shape,
} from "store/dataV2/types";
import { dataSliceV2 } from "store/dataV2";
import { generateKind, generateUUID } from "store/dataV2/utils";

import { useSegmenterApi } from "utils/dl/segmentation";
import { toInferenceInput } from "utils/dl/utils";
import { getStackTraceFromError } from "utils/logUtils";
import { AlertType } from "utils/enums";
import type { AlertState, LoadCB } from "utils/types";
import type {
  PredictedAnnotationObject,
  SegmentaionModelDetails,
} from "utils/dl/segmentation/types";

import { useSegmenterStatus } from "../contexts/SegmenterStatusProvider";

export const usePredictSegmenter = () => {
  const dispatch = useDispatch();

  const allImages = useSelector(selectExtendedImages);
  const selectedImages = useSelector(selectSelectedImages);
  const kinds = useSelector(selectAllKinds);
  const { setModelStatus, selectedModel } = useSegmenterStatus();
  const segApi = useSegmenterApi();

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
      setModelStatus("idle");
    },
    [dispatch],
  );

  const predictSegmenter = useCallback(async () => {
    if (!selectedModel) return;
    const modelInfoResult = await segApi.getModelInfo(selectedModel.name);
    let modelDetails: SegmentaionModelDetails;
    if (modelInfoResult.success) modelDetails = modelInfoResult.data;
    else {
      await handleError(
        new Error(
          `[predictSegmenter] ${modelInfoResult.reason.code}: ${modelInfoResult.reason.message}`,
          { cause: modelInfoResult.reason.cause },
        ),
        "fetch details error",
      );
      return;
    }

    if (!modelDetails.modelLoaded) {
      const loadResult = await segApi.loadModel(selectedModel.name);
      if (!loadResult.success) {
        await handleError(
          new Error(
            `[predictSegmenter] ${loadResult.reason.code}: ${loadResult.reason.message}`,
            { cause: loadResult.reason.cause },
          ),
          "fetch details error",
        );
      }
    }
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
    setModelStatus("predicting");

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

    let predictedAnnotations: PredictedAnnotationObject[][];
    try {
      const predictionResult = await segApi.predict(
        selectedModel.name,
        inferenceImages.map(toInferenceInput),
        progressCb,
      );
      if (predictionResult.success) {
        predictedAnnotations = predictionResult.data;
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
      } else
        throw new Error(
          `[predictSegmenter] ${predictionResult.reason.code}: ${predictionResult.reason.message}`,
          { cause: predictionResult.reason.cause },
        );
    } catch (error) {
      await handleError(error as Error, "Error in running predictions");
      progressCb(1, "");
      return;
    }

    try {
      const uniquePredictedKindNames = [
        ...new Set(
          predictedAnnotations.flatMap((imAnns) =>
            imAnns.map((ann) => ann.kindName as string),
          ),
        ),
      ];

      const addKindPayload: Array<{
        kind: Kind;
        category: AnnotationCategory;
      }> = [];

      const predictedKinds: Record<string, Kind> = {};
      uniquePredictedKindNames.forEach((kindName) => {
        const existingKind = kinds.find((k) => k.name === kindName);
        if (!existingKind) {
          const generated = generateKind(kindName);
          predictedKinds[generated.kind.name] = generated.kind;
          addKindPayload.push({
            kind: generated.kind,
            category: generated.unknownCategory,
          });
          return;
        }
        predictedKinds[existingKind.name] = existingKind;
      });

      dispatch(dataSliceV2.actions.batchAddKind(addKindPayload));

      const annVolumes: AnnotationVolume[] = [];
      const annotations: AnnotationObject[] = [];
      for await (const [i, _annotations] of predictedAnnotations.entries()) {
        const image = inferenceImages[i];

        for (let j = 0; j < _annotations.length; j++) {
          const { kindName, ...predictedAnn } = _annotations[j];
          const bbox = predictedAnn.boundingBox!;
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

          const annKind = predictedKinds[kindName];

          if (!annKind) {
            console.error("cannot find kind for annotation");
            continue;
          }
          const annVol: AnnotationVolume = {
            id: generateUUID(),
            kindId: annKind.id,
            imageId: image.id,
            categoryId: annKind.unknownCategoryId,
          };
          const finalAnn: AnnotationObject = {
            ...predictedAnn,
            shape,
            imageId: image.id,
            planeId: image.activePlaneId,
            volumeId: annVol.id,
          };
          annVolumes.push(annVol);
          annotations.push(finalAnn);
        }
      }
      batch(() => {
        dispatch(dataSliceV2.actions.batchAddAnnotationVolume(annVolumes));
        dispatch(dataSliceV2.actions.batchAddAnnotation(annotations));
      });
    } catch (error) {
      await handleError(
        error as Error,
        "Error converting predictions to Piximi types",
      );
      progressCb(1, "");

      return;
    }

    progressCb(1, "");
    setModelStatus("idle");
  }, [handleError, allImages, selectedModel, selectedImages, kinds]);

  return predictSegmenter;
};
