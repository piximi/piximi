import {
  CombinedState,
  ListenerEffectAPI,
  createListenerMiddleware,
} from "@reduxjs/toolkit";
import * as tf from "@tensorflow/tfjs";
import {
  AnnotatorState,
  AppDispatch,
  AppSettingsState,
  ClassifierState,
  ImageViewerState,
  ProjectState,
  SegmenterState,
  TypedAppStartListening,
} from "store/types";
import { DataState } from "store/types";
import { segmenterSlice } from "./segmenterSlice";
import { getCompleteEntity, getDeferredProperty } from "store/entities/utils";
import { applicationSettingsSlice } from "store/applicationSettings";
import { dataSlice } from "store/data/dataSlice";
import Image from "image-js";
import { OrphanedAnnotationObject } from "utils/models/AbstractSegmenter/AbstractSegmenter";
import { TrainingCallbacks } from "utils/models/types";
import { ModelStatus, Partition } from "utils/models/enums";
import { availableSegmenterModels } from "utils/models/availableSegmentationModels";
import { UNKNOWN_IMAGE_CATEGORY_COLOR } from "utils/common/constants";
import { getStackTraceFromError } from "utils/common/helpers";
import { AlertType } from "utils/common/enums";
import { AlertState } from "utils/common/types";
import {
  Kind,
  AnnotationObject,
  Category,
  ImageObject,
  Shape,
} from "store/data/types";
import { UNKNOWN_CATEGORY_NAME } from "store/data/constants";

export const segmenterMiddleware = createListenerMiddleware();

const startAppListening =
  segmenterMiddleware.startListening as TypedAppStartListening;

type StoreListemerAPI = ListenerEffectAPI<
  CombinedState<{
    classifier: ClassifierState;
    segmenter: SegmenterState;
    imageViewer: ImageViewerState;
    project: ProjectState;
    applicationSettings: AppSettingsState;
    annotator: AnnotatorState;
    newData: DataState;
  }>,
  AppDispatch,
  unknown
>;

startAppListening({
  actionCreator: segmenterSlice.actions.updateModelStatus,
  effect: async (action, listenerAPI) => {
    listenerAPI.unsubscribe();

    switch (action.payload.modelStatus) {
      case ModelStatus.InitFit:
      case ModelStatus.Training:
        await fitListener(action.payload.onEpochEnd, listenerAPI);
        break;
      case ModelStatus.Predicting:
        await predictListener(listenerAPI);
        break;
      default:
        break;
    }
    listenerAPI.subscribe();
  },
});

const fitListener = async (
  onEpochEnd: TrainingCallbacks["onEpochEnd"] | undefined,
  listenerAPI: StoreListemerAPI
) => {};

const predictListener = async (listenerAPI: StoreListemerAPI) => {
  const { newData: dataState, segmenter: segmenterState } =
    listenerAPI.getState();

  /* SEGMENTER */
  const previousModelStatus =
    listenerAPI.getOriginalState().segmenter.modelStatus;
  const modelIdx = segmenterState.selectedModelIdx;
  const model = availableSegmenterModels[modelIdx];
  const fitOptions = segmenterState.fitOptions;

  /* KIND */
  const imageKind = getCompleteEntity(dataState.kinds.entities["Image"]);
  if (!imageKind) {
    listenerAPI.dispatch(
      segmenterSlice.actions.updateModelStatus({
        modelStatus: previousModelStatus,
      })
    );
    return;
  }

  /* DATA */
  const kinds = dataState.kinds.ids.reduce((kinds: Kind[], id) => {
    if (id !== "Image") {
      const kind = getCompleteEntity(dataState.kinds.entities[id]);
      if (kind) {
        kinds.push(kind);
      }
    }
    return kinds;
  }, []);
  const imageIds = getDeferredProperty(
    dataState.kinds.entities["Image"],
    "containing"
  );
  const inferenceImages = imageIds.reduce((infIms: ImageObject[], id) => {
    const image = getCompleteEntity(dataState.things.entities[id]);

    if (image && "containing" in image) {
      if (image.containing.length === 0) {
        infIms.push(image);
      }
    }
    return infIms;
  }, []);

  if (inferenceImages.length === 0) {
    await handleError(
      "Inference set it empty",
      listenerAPI,
      previousModelStatus,
      "No unlabeled images to predict."
    );

    return;
  }

  listenerAPI.dispatch(
    dataSlice.actions.updateThings({
      updates: inferenceImages.map((image) => ({
        id: image.id,
        partition: Partition.Inference,
      })),
      isPermanent: true,
    })
  );

  /* PREDICT */

  const hasOwnKinds = model.trainable;

  try {
    model.loadInference(inferenceImages, {
      kinds: hasOwnKinds ? kinds : undefined,
      fitOptions,
    });
  } catch (error) {
    await handleError(
      "Error in processing the inference data.",
      listenerAPI,
      previousModelStatus,
      error as Error
    );
    return;
  }

  let predictedAnnotations: OrphanedAnnotationObject[][];
  try {
    predictedAnnotations = await model.predict();
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
    await handleError(
      "Error in running predictions",
      listenerAPI,
      previousModelStatus,
      error as Error
    );
    return;
  }

  try {
    if (!hasOwnKinds) {
      const uniquePredictedKinds = [
        ...new Set(
          predictedAnnotations.flatMap((imAnns) =>
            imAnns.map((ann) => ann.kind as string)
          )
        ),
      ];

      const generatedKinds = model.inferenceKindsById([
        ...kinds.map((kind) => kind.id),
        ...uniquePredictedKinds,
      ]);
      listenerAPI.dispatch(
        dataSlice.actions.addKinds({
          kinds: generatedKinds,
          isPermanent: true,
        })
      );

      const newUnknownCategories = generatedKinds.map((kind) => {
        return {
          id: kind.unknownCategoryId,
          name: UNKNOWN_CATEGORY_NAME,
          color: UNKNOWN_IMAGE_CATEGORY_COLOR,
          containing: [],
          kind: kind.id,
          visible: true,
        } as Category;
      });
      listenerAPI.dispatch(
        dataSlice.actions.addCategories({
          categories: newUnknownCategories,
          isPermanent: true,
        })
      );
    }
    const annotations: AnnotationObject[] = [];
    for await (const [i, _annotations] of predictedAnnotations.entries()) {
      const image = inferenceImages[i];

      const imageJsImage = await Image.load(image.src);

      for (let j = 0; j < _annotations.length; j++) {
        const ann = _annotations[j] as Partial<AnnotationObject>;
        const bbox = ann.boundingBox!;
        const width = bbox[2] - bbox[0];
        const height = bbox[3] - bbox[1];

        if (bbox[1] + height > imageJsImage.height) {
          continue;
        }
        const annObj = imageJsImage.crop({
          x: bbox[0],
          y: bbox[1],
          width,
          height,
        });
        const src = annObj.getCanvas().toDataURL();
        const shape: Shape = {
          planes: 1,
          channels: image.shape.channels,
          width,
          height,
        };
        const data = tf.tidy(() =>
          tf.browser.fromPixels(annObj).expandDims(1)
        ) as tf.Tensor4D;

        ann.src = src;
        ann.data = data;
        ann.shape = shape;
        ann.name = `${image.name}-${ann.kind}_${j}`;
        ann.imageId = image.id;
        ann.bitDepth = image.bitDepth;
        annotations.push(ann as AnnotationObject);
      }
    }
    listenerAPI.dispatch(
      dataSlice.actions.addThings({ things: annotations, isPermanent: true })
    );
  } catch (error) {
    await handleError(
      "Error converting predictions to Piximi types",
      listenerAPI,
      previousModelStatus,
      error as Error
    );
    return;
  }

  listenerAPI.dispatch(
    segmenterSlice.actions.updateModelStatus({
      modelStatus: ModelStatus.Trained,
    })
  );
};

async function handleError(
  name: string,
  listenerAPI: StoreListemerAPI,
  previousModelStatus: ModelStatus,
  description: string
): Promise<void>;
async function handleError(
  name: string,
  listenerAPI: StoreListemerAPI,
  previousModelStatus: ModelStatus,
  error: Error
): Promise<void>;
async function handleError(
  name: string,
  listenerAPI: StoreListemerAPI,
  previousModelStatus: ModelStatus,
  descriptionOrError: string | Error
) {
  let description: string;
  let stackTrace: string | undefined = undefined;
  let alertType: AlertType;
  if (typeof descriptionOrError === "string") {
    description = descriptionOrError;
    alertType = AlertType.Info;
  } else {
    const error = descriptionOrError as Error;
    stackTrace = await getStackTraceFromError(error);
    description = `${error.name}:\n${error.message}`;
    alertType = AlertType.Error;
  }
  const alertState: AlertState = {
    alertType,
    name,
    description,
    stackTrace,
  };

  listenerAPI.dispatch(
    applicationSettingsSlice.actions.updateAlertState({
      alertState: alertState,
    })
  );
  listenerAPI.dispatch(
    segmenterSlice.actions.updateModelStatus({
      modelStatus: previousModelStatus,
    })
  );
}
