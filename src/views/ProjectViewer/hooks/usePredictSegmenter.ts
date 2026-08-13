import { useCallback } from "react";

import { batch, useDispatch, useSelector } from "react-redux";

import { selectAllKinds, selectExtendedImages } from "store/data/selectors";
import { selectSelectedImages } from "@ProjectViewer/state/reselectors";
import { applicationSettingsSlice } from "store/applicationSettings";
import type {
  AnnotationCategory,
  AnnotationObject,
  AnnotationVolume,
  Kind,
  Shape,
} from "store/data/types";
import { dataSlice } from "store/data";
import { generateKind, generateUUID } from "store/data/utils";
import { appTasksSlice } from "store/appTasks/appTasksSlice";
import { taskCancelRegistry } from "store/appTasks/taskCancelRegistry";

import { useSegmenterApi } from "utils/dl/segmentation";
import { toInferenceInput } from "utils/dl/utils";
import { getStackTraceFromError } from "utils/logUtils";
import { AlertType } from "utils/enums";
import type { AlertState, LoadCB } from "utils/types";
import type {
  PredictedAnnotationObject,
  SegmentaionModelDetails,
} from "utils/dl/segmentation/types";
import { CancelSource } from "utils/dl/cancel";

import { useSegmenterStatus } from "../contexts/SegmenterStatusProvider";

export const usePredictSegmenter = () => {
  const dispatch = useDispatch();

  const allImages = useSelector(selectExtendedImages);
  const selectedImages = useSelector(selectSelectedImages);
  const kinds = useSelector(selectAllKinds);
  const { setModelStatus, loadedModel, selectedChannels } =
    useSegmenterStatus();
  const segApi = useSegmenterApi();
  const Cancel = new CancelSource();

  const handleError = useCallback(
    async (error: Error, name: string, taskId: string) => {
      const stackTrace = await getStackTraceFromError(error);
      const errorMessage = `${error.name}:\n${error.message}`;

      const alertState: AlertState = {
        alertType: AlertType.Error,
        name: name,
        description: errorMessage,
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
        appTasksSlice.actions.taskFailed({ id: taskId, error: errorMessage }),
      );
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
    if (!loadedModel) return;
    Cancel.reset();
    const taskId = generateUUID();
    dispatch(
      appTasksSlice.actions.taskRegistered({
        id: taskId,
        type: "image-segmentation",
        progress: 0,
        status: "running",
        label: "Beginning Segmentation",
        cancellable: true,
        startedAt: Date.now(),
      }),
    );
    taskCancelRegistry.register(taskId, async () => {
      Cancel.signal();
      dispatch(
        appTasksSlice.actions.taskUpdated({
          id: taskId,
          progress: 100,
          status: "stopping",
          label: "Stopping...",
        }),
      );
      //await segApi.stopExecution(selectedModel.name);
    });
    const modelInfoResult = await segApi.getModelInfo(loadedModel.name);
    let modelDetails: SegmentaionModelDetails;
    if (modelInfoResult.success) modelDetails = modelInfoResult.data;
    else {
      await handleError(
        new Error(
          `[predictSegmenter] ${modelInfoResult.reason.code}: ${modelInfoResult.reason.message}`,
          { cause: modelInfoResult.reason.cause },
        ),
        "fetch details error",
        taskId,
      );
      return;
    }

    if (!modelDetails.modelLoaded) {
      const loadResult = await segApi.loadModel(loadedModel.name);
      if (!loadResult.success) {
        await handleError(
          new Error(
            `[predictSegmenter] ${loadResult.reason.code}: ${loadResult.reason.message}`,
            { cause: loadResult.reason.cause },
          ),
          "fetch details error",
          taskId,
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
        taskId,
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
        appTasksSlice.actions.taskUpdated({
          id: taskId,
          progress: progressPercent,
          label: progressMessage,
        }),
      );
    };

    progressCb(-1, "starting inference...");

    let predictedAnnotations: PredictedAnnotationObject[][];
    let predictionCancelled: boolean = false;
    try {
      const predictionResult = await segApi.predict(
        loadedModel.name,
        inferenceImages.map((item) =>
          toInferenceInput(
            item,
            !selectedChannels.some((id) => id === "")
              ? selectedChannels
              : undefined,
          ),
        ),
        Cancel.token,
        progressCb,
      );
      if (predictionResult.success) {
        predictedAnnotations = predictionResult.data.annotations;
        predictionCancelled = !!predictionResult.data.cancelled;
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
      await handleError(error as Error, "Error in running predictions", taskId);

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

      dispatch(dataSlice.actions.batchAddKind(addKindPayload));

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
        dispatch(dataSlice.actions.batchAddAnnotationVolume(annVolumes));
        dispatch(dataSlice.actions.batchAddAnnotation(annotations));
      });
    } catch (error) {
      await handleError(
        error as Error,
        "Error converting predictions to Piximi types",
        taskId,
      );

      return;
    }
    if (predictionCancelled)
      dispatch(appTasksSlice.actions.taskCancelled({ id: taskId }));
    else dispatch(appTasksSlice.actions.taskCompleted({ id: taskId }));
    setModelStatus("idle");
  }, [handleError, allImages, loadedModel, selectedImages, kinds]);

  return predictSegmenter;
};
