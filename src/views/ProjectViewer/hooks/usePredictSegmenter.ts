import { useDispatch, useSelector } from "react-redux";
import ImageJS from "image-js";
import { useSegmenterStatus } from "../contexts/SegmenterStatusProvider";
import {
  selectSegmenterInferenceOptions,
  selectSegmenterModel,
} from "store/segmenter/selectors";
import { useCallback, useMemo } from "react";
import { getStackTraceFromError } from "utils/logUtils";
import { AlertState } from "utils/types";
import { AlertType } from "utils/enums";
import { applicationSettingsSlice } from "store/applicationSettings";
import { ModelStatus } from "utils/models/enums";
import { selectAllImages, selectAllKinds } from "store/data/selectors";
import { selectActiveSelectedThings } from "store/project/reselectors";
import {
  AnnotationObject,
  Category,
  ImageObject,
  Shape,
} from "store/data/types";
import { intersection } from "lodash";
import { LoadCB } from "utils/file-io/types";
import { OrphanedAnnotationObject } from "utils/models/segmentation";
import { dataSlice } from "store/data";
import {
  UNKNOWN_CATEGORY_NAME,
  UNKNOWN_IMAGE_CATEGORY_COLOR,
} from "store/data/constants";
import { getPropertiesFromImageSync } from "store/data/utils";

export const usePredictSegmenter = () => {
  const dispatch = useDispatch();
  const selectedModel = useSelector(selectSegmenterModel);
  const projectImages = useSelector(selectAllImages);
  const selectedThings = useSelector(selectActiveSelectedThings);
  const fitOptions = useSelector(selectSegmenterInferenceOptions);
  const kinds = useSelector(selectAllKinds);
  const { setModelStatus } = useSegmenterStatus();

  const selectedImages = useMemo(() => {
    return selectedThings.filter((thing) => thing.kind === "Image");
  }, [selectedThings]);

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
    const existingObjects: string[] = [];
    const images =
      selectedImages.length > 0
        ? (selectedImages as ImageObject[])
        : projectImages;

    if (selectedModel.kind) {
      const fullKind = kinds.find((kind) => kind.id === selectedModel.kind);
      if (fullKind && fullKind.containing.length > 0) {
        existingObjects.push(...fullKind.containing);
      }
    }

    const inferenceImages = images.reduce((infIms: ImageObject[], image) => {
      if (image && "containing" in image) {
        const containedObjects = image.containing;

        if (intersection(containedObjects, existingObjects).length === 0) {
          infIms.push(image);
        }
      }
      return infIms;
    }, []);

    if (inferenceImages.length === 0) {
      await handleError(
        new Error("Inference set is empty"),
        `There are no images to segment.`,
      );

      return;
    }

    /* PREDICT */
    setModelStatus(ModelStatus.Predicting);
    const hasOwnKinds = selectedModel.trainable;

    try {
      selectedModel.loadInference(inferenceImages, {
        kinds: hasOwnKinds ? kinds : undefined,
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
      if (!hasOwnKinds) {
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
            name: UNKNOWN_CATEGORY_NAME,
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
      }
      const annotations: AnnotationObject[] = [];
      for await (const [i, _annotations] of predictedAnnotations.entries()) {
        const image = inferenceImages[i];

        const imageJsImage = await ImageJS.load(image.src);

        for (let j = 0; j < _annotations.length; j++) {
          const ann = _annotations[j] as Partial<AnnotationObject>;
          const bbox = ann.boundingBox!;
          const width = bbox[2] - bbox[0];
          const height = bbox[3] - bbox[1];

          if (bbox[1] + height > imageJsImage.height) {
            continue;
          }

          const { src, data } = getPropertiesFromImageSync(
            imageJsImage,
            image,
            {
              boundingBox: bbox,
            },
          );
          const shape: Shape = {
            planes: 1,
            channels: image.shape.channels,
            width,
            height,
          };

          ann.src = src;
          ann.data = data;
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
    projectImages,
    selectedModel,
    selectedImages,
    fitOptions,
    kinds,
  ]);

  return predictSegmenter;
};
