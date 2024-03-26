import {
  CombinedState,
  ListenerEffectAPI,
  createListenerMiddleware,
} from "@reduxjs/toolkit";
import * as tf from "@tensorflow/tfjs";
import { AppDispatch } from "store/productionStore";
import {
  AlertStateType,
  AlertType,
  Annotator,
  ApplicationSettings,
  Classifier,
  Data,
  ImageViewer,
  Partition,
  Project,
  Segmenter,
  Shape,
  TypedAppStartListening,
} from "types";
import { NewDataState } from "types/NewData";
import { segmenterSlice } from "../segmenterSlice";
import { ModelStatus, availableSegmenterModels } from "types/ModelType";
import { TrainingCallbacks } from "utils/common/models/Model";
import { getCompleteEntity, getDeferredProperty } from "store/entities/utils";
import { NewImageType } from "types/ImageType";
import { applicationSettingsSlice } from "store/slices/applicationSettings";
import { newDataSlice } from "store/slices/newData/newDataSlice";
import { NewAnnotationType } from "types/AnnotationType";
import { getStackTraceFromError } from "utils";
import { Kind, NewCategory, UNKNOWN_CATEGORY_NAME } from "types/Category";
import Image from "image-js";
import { NewOrphanedAnnotationType } from "utils/common/models/AbstractSegmenter/AbstractSegmenter";
import { UNKNOWN_IMAGE_CATEGORY_COLOR } from "utils/common/colorPalette";

export const segmenterMiddleware = createListenerMiddleware();

export const startAppListening =
  segmenterMiddleware.startListening as TypedAppStartListening;

type StoreListemerAPI = ListenerEffectAPI<
  CombinedState<{
    classifier: Classifier;
    segmenter: Segmenter;
    imageViewer: ImageViewer;
    project: Project;
    applicationSettings: ApplicationSettings;
    data: Data;
    annotator: Annotator;
    newData: NewDataState;
  }>,
  AppDispatch,
  unknown
>;

startAppListening({
  actionCreator: segmenterSlice.actions.updateModelStatusNew,
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
      segmenterSlice.actions.updateModelStatusNew({
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
  const inferenceImages = imageIds.reduce((infIms: NewImageType[], id) => {
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
    newDataSlice.actions.updateThings({
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

  let predictedAnnotations: NewOrphanedAnnotationType[][];
  try {
    predictedAnnotations = await model.predictNew();
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
        newDataSlice.actions.addKinds({
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
        } as NewCategory;
      });
      listenerAPI.dispatch(
        newDataSlice.actions.addCategories({
          categories: newUnknownCategories,
          isPermanent: true,
        })
      );
    }
    const annotations: NewAnnotationType[] = [];
    for await (const [i, _annotations] of predictedAnnotations.entries()) {
      const image = inferenceImages[i];
      const imageJsImage = await Image.load(image.src);

      for (let j = 0; j < _annotations.length; j++) {
        const ann = _annotations[j] as Partial<NewAnnotationType>;
        const bbox = ann.boundingBox!;
        const width = bbox[2] - bbox[0];
        const height = bbox[3] - bbox[1];

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
        const data = tf.browser.fromPixels(annObj).expandDims(1) as tf.Tensor4D;

        ann.src = src;
        ann.data = data;
        ann.shape = shape;
        ann.name = `${image.name}-${ann.kind}_${j}`;
        ann.imageId = image.id;
        ann.bitDepth = image.bitDepth;
        annotations.push(ann as NewAnnotationType);
      }
    }
    listenerAPI.dispatch(
      newDataSlice.actions.addThings({ things: annotations, isPermanent: true })
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
    segmenterSlice.actions.updateModelStatusNew({
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
  const alertState: AlertStateType = {
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
    segmenterSlice.actions.updateModelStatusNew({
      modelStatus: previousModelStatus,
    })
  );
}
