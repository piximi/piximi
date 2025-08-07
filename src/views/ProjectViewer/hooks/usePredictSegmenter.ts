import { useDispatch, useSelector } from "react-redux";
import ImageJS from "image-js";
import { useSegmenterStatus } from "../contexts/SegmenterStatusProvider";
import {
  selectSegmenterInferenceOptions,
  selectSegmenterModel,
} from "store/segmenter/selectors";
import { useCallback } from "react";
import { getStackTraceFromError } from "utils/logUtils";
import { AlertState } from "utils/types";
import { AlertType } from "utils/enums";
import { applicationSettingsSlice } from "store/applicationSettings";
import { ModelStatus } from "utils/models/enums";
import { selectAllKinds, selectImageDictionary } from "store/data/selectors";
import { selectSelectedImages } from "store/project/selectors";
import {
  Category,
  FullTimepointImage,
  Shape,
  TSAnnotationObject,
  TSImageObject,
} from "store/data/types";
import { intersection } from "lodash";
import { LoadCB } from "utils/file-io/types";
import { OrphanedAnnotationObject } from "utils/models/segmentation";
import { dataSlice } from "store/data";
import {
  UNKNOWN_CATEGORY_NAME,
  UNKNOWN_IMAGE_CATEGORY_COLOR,
} from "store/data/constants";
import {
  getPropertiesFromImageSync,
  extractAllTimepoints,
  extractAllZPlanes,
  extractChannel,
} from "store/data/utils";

export const usePredictSegmenter = () => {
  const dispatch = useDispatch();
  const selectedModel = useSelector(selectSegmenterModel);
  const projectImages = useSelector(selectImageDictionary);
  const selectedImages = useSelector(selectSelectedImages);
  const fitOptions = useSelector(selectSegmenterInferenceOptions);
  const kinds = useSelector(selectAllKinds);
  const { setModelStatus, selectedChannel } = useSegmenterStatus();

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

    let images = Object.keys(selectedImages).reduce(
      (infIms: TSImageObject[], id) => {
        const image = projectImages[id];
        const containedObjects = image.containing;

        if (intersection(containedObjects, existingObjects).length === 0) {
          infIms.push(image);
        }
        return infIms;
      },
      [],
    );
    if (images.length === 0) images = Object.values(projectImages);

    if (selectedModel.kind) {
      const fullKind = kinds.find((kind) => kind.id === selectedModel.kind);
      if (fullKind && fullKind.containing.length > 0) {
        existingObjects.push(...fullKind.containing);
      }
    }

    const inferenceImages = images.reduce((infIms: TSImageObject[], image) => {
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

    const extractedTimepoints = inferenceImages.reduce(
      (tpImages: FullTimepointImage[], imageSeries) => {
        const extractedTimepoints = extractAllTimepoints(imageSeries);
        tpImages.push(...extractedTimepoints);
        return tpImages;
      },
      [],
    );

    const extractedPlanes = extractedTimepoints.reduce(
      (imagePlanes: FullTimepointImage[], timepointImage) => {
        const extractedPlanes = extractAllZPlanes(timepointImage);
        imagePlanes.push(...extractedPlanes);
        return imagePlanes;
      },
      [],
    );

    let extractedImages: FullTimepointImage[];
    if (selectedChannel > -1) {
      // dispose when done
      extractedImages = extractedPlanes.map((imagePlane) => {
        return extractChannel(imagePlane, selectedChannel);
      });
    } else {
      extractedImages = extractedPlanes;
    }

    /* PREDICT */
    setModelStatus(ModelStatus.Predicting);
    const hasOwnKinds = selectedModel.trainable;

    try {
      selectedModel.loadInference(extractedImages, {
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
      const annotations: TSAnnotationObject[] = [];
      for await (const [i, _annotations] of predictedAnnotations.entries()) {
        const image = extractedImages[i];

        const imageJsImage = await ImageJS.load(image.src);

        for (let j = 0; j < _annotations.length; j++) {
          const ann = _annotations[j] as Partial<TSAnnotationObject>;
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
          ann.timepoint = image.timepoint;
          ann.plane = image.activePlane;
          annotations.push(ann as TSAnnotationObject);
        }
      }
      dispatch(dataSlice.actions.addTSAnnotations({ annotations }));
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
