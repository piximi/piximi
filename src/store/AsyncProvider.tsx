import React, { ReactElement, useEffect, useState } from "react";
import { cellPaintingAnnotations } from "data/exampleImages";
import colorImage from "images/cell-painting.png";
import { RootState } from "./rootReducer";
import { classifierSlice } from "./classifier";
import { annotatorSlice } from "./annotator";
import { applicationSettingsSlice } from "./applicationSettings";
import { imageViewerSlice } from "./imageViewer";
import { dataSlice } from "./data/dataSlice";
import { projectSlice } from "./project";
import { segmenterSlice } from "./segmenter";

import { DeferredEntityState } from "./entities";
import { initStore } from "./productionStore";
import { Provider } from "react-redux";
import { generateUUID } from "utils/common/helpers";
import { logger } from "utils/common/helpers";
import { Partition } from "utils/models/enums";
import { SerializedFileType } from "utils/file-io/types";
import { loadExampleImage } from "utils/file-io/loadExampleImage";
import { UNKNOWN_IMAGE_CATEGORY_COLOR } from "utils/common/constants";
import {
  OldCategory,
  OldImageType,
  Kind,
  AnnotationObject,
  Category,
  ImageObject,
} from "./data/types";
import { UNKNOWN_CATEGORY_NAME } from "./data/constants";
import { measurementsSlice } from "./measurements/measurementsSlice";

const loadState = async () => {
  const preloadedState: RootState = {
    classifier: classifierSlice.getInitialState(),
    annotator: annotatorSlice.getInitialState(),
    applicationSettings: applicationSettingsSlice.getInitialState(),
    imageViewer: imageViewerSlice.getInitialState(),
    data: dataSlice.getInitialState(),
    project: projectSlice.getInitialState(),
    segmenter: segmenterSlice.getInitialState(),
    measurements: measurementsSlice.getInitialState(),
  };

  const { image, annotationCategories, annotations } = (await loadExampleImage(
    colorImage,
    cellPaintingAnnotations as SerializedFileType,
    // imageFile.name points to
    // "/static/media/cell-painting.f118ef087853056f08e6.png"
    "cell-painting.png"
  )) as {
    image: OldImageType;
    annotationCategories: OldCategory[];
    annotations: AnnotationObject[];
  };

  const categories: DeferredEntityState<Category> = {
    ids: [],
    entities: {},
  };
  const things: DeferredEntityState<ImageObject | AnnotationObject> = {
    ids: [],
    entities: {},
  };
  const kinds: DeferredEntityState<Kind> = { ids: [], entities: {} };

  kinds.ids.push("Image");
  const unknownCategoryId = generateUUID({ definesUnknown: true });
  const unknownCategory: Category = {
    id: unknownCategoryId,
    name: UNKNOWN_CATEGORY_NAME,
    color: UNKNOWN_IMAGE_CATEGORY_COLOR,
    containing: [],
    kind: "Image",
    visible: true,
  };

  kinds.entities["Image"] = {
    saved: {
      id: "Image",
      containing: [image.id],
      categories: [unknownCategoryId],
      unknownCategoryId,
    },
    changes: {},
  };

  image.kind = "Image";
  image.categoryId = unknownCategoryId;
  image.containing = annotations.map((annotation) => annotation.id);

  things.ids.push(image.id);

  things.entities[image.id] = { saved: image as ImageObject, changes: {} };

  categories.ids.push(unknownCategoryId);
  categories.entities[unknownCategoryId] = {
    saved: {
      ...unknownCategory,
      containing: [image.id],
    },
    changes: {},
  };
  const anCat2KindNAme: Record<string, string> = {};
  for (const anCat of annotationCategories) {
    kinds.ids.push(anCat.name);
    const unknownCategoryId = generateUUID({ definesUnknown: true });
    const unknownCategory: Category = {
      id: unknownCategoryId,
      name: UNKNOWN_CATEGORY_NAME,
      color: UNKNOWN_IMAGE_CATEGORY_COLOR,
      containing: [],
      kind: anCat.name,
      visible: true,
    };
    kinds.entities[anCat.name] = {
      saved: {
        id: anCat.name,
        containing: [],
        categories: [unknownCategoryId],
        unknownCategoryId,
      },
      changes: {},
    };
    anCat2KindNAme[anCat.id] = anCat.name;
    categories.ids.push(unknownCategoryId);
    categories.entities[unknownCategoryId] = {
      saved: {
        ...unknownCategory,
        containing: [],
      },
      changes: {},
    };
  }
  const numAnnotationsOfKindPerImage: Record<string, number> = {};

  for (const annotation of annotations) {
    annotation.kind = anCat2KindNAme[annotation.categoryId];
    annotation.activePlane = annotation.plane ?? 0;
    let annotationName: string = `${image.name}-${annotation.kind}`;
    if (annotationName in numAnnotationsOfKindPerImage) {
      annotationName += `_${numAnnotationsOfKindPerImage[annotationName]++}`;
    } else {
      numAnnotationsOfKindPerImage[annotationName] = 1;
      annotationName += "_0";
    }
    const kind = kinds.entities[annotation.kind];

    annotation.name = annotationName;
    annotation.categoryId = kind.saved.unknownCategoryId;
    const shapeArray = annotation.data.shape;
    annotation.shape = {
      planes: shapeArray[0],
      height: shapeArray[1],
      width: shapeArray[2],
      channels: shapeArray[3],
    };

    annotation.partition = Partition.Unassigned;
    things.ids.push(annotation.id);

    things.entities[annotation.id] = {
      saved: annotation as AnnotationObject,
      changes: {},
    };

    kinds.entities[annotation.kind].saved.containing.push(annotation.id);
    categories.entities[annotation.categoryId].saved.containing.push(
      annotation.id
    );
  }
  preloadedState.data = { kinds, categories, things };
  return preloadedState;
};

export const AsyncProvider = ({
  children,
}: {
  children: ReactElement<any, any>;
}) => {
  const [preloaded, setPreloaded] = useState<{
    isReady: boolean;
    state: RootState | undefined;
  }>({ isReady: false, state: undefined });

  useEffect(() => {
    loadState()
      .then((state: RootState) => {
        setPreloaded({ isReady: true, state });
      })
      .catch(() => {
        logger("Failed to load preloaded state");
        setPreloaded({ isReady: true, state: undefined });
      });
  }, [setPreloaded]);

  return preloaded.isReady ? (
    <Provider store={initStore(preloaded.state)}>{children}</Provider>
  ) : (
    <></>
  );
};
