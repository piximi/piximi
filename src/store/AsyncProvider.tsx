import React, { ReactElement, useEffect, useState } from "react";
import { cellPaintingAnnotations } from "data/exampleImages";
import colorImage from "images/cell-painting.png";

import { RootState } from "./rootReducer";
import { classifierSlice } from "./slices/classifier";
import { annotatorSlice } from "./slices/annotator";
import { applicationSettingsSlice } from "./slices/applicationSettings";
import { imageViewerSlice } from "./slices/imageViewer";
import { dataSlice } from "./slices/data";
import { newDataSlice } from "./slices/newData/newDataSlice";
import { projectSlice } from "./slices/project";
import { segmenterSlice } from "./slices/segmenter";
import { loadExampleImage } from "utils/common/image";
import { SerializedFileType } from "types";
import {
  Kind,
  NEW_UNKNOWN_CATEGORY,
  NEW_UNKNOWN_CATEGORY_ID,
  NewCategory,
} from "types/Category";
import { NewAnnotationType } from "types/AnnotationType";
import { NewImageType } from "types/ImageType";
import { DeferredEntityState } from "./entities";
import { initStore } from "./productionStore";
import { Provider } from "react-redux";

const loadState = async () => {
  const preloadedState: RootState = {
    classifier: classifierSlice.getInitialState(),
    annotator: annotatorSlice.getInitialState(),
    applicationSettings: applicationSettingsSlice.getInitialState(),
    imageViewer: imageViewerSlice.getInitialState(),
    data: dataSlice.getInitialState(),
    newData: newDataSlice.getInitialState(),
    project: projectSlice.getInitialState(),
    segmenter: segmenterSlice.getInitialState(),
  };

  const { image, annotationCategories, annotations } = await loadExampleImage(
    colorImage,
    cellPaintingAnnotations as SerializedFileType,
    // imageFile.name points to
    // "/static/media/cell-painting.f118ef087853056f08e6.png"
    "cell-painting.png"
  );

  const categories: DeferredEntityState<NewCategory> = {
    ids: [],
    entities: {},
  };
  const things: DeferredEntityState<NewImageType | NewAnnotationType> = {
    ids: [],
    entities: {},
  };
  const kinds: DeferredEntityState<Kind> = { ids: [], entities: {} };

  kinds.ids.push("Image");

  kinds.entities["Image"] = {
    saved: {
      id: "Image",
      containing: [image.id],
      categories: [NEW_UNKNOWN_CATEGORY_ID],
    },
    changes: {},
  };

  image.kind = "Image";
  image.containing = annotations.map((annotation) => annotation.id);

  things.ids.push(image.id);

  things.entities[image.id] = { saved: image as NewImageType, changes: {} };

  categories.ids.push(NEW_UNKNOWN_CATEGORY_ID);
  categories.entities[NEW_UNKNOWN_CATEGORY_ID] = {
    saved: {
      ...NEW_UNKNOWN_CATEGORY,
      containing: [image.id, ...annotations.map((an) => an.id)],
    },
    changes: {},
  };

  const anCat2KindNAme: Record<string, string> = {};
  for (const anCat of annotationCategories) {
    kinds.ids.push(anCat.name);
    kinds.entities[anCat.name] = {
      saved: {
        id: anCat.name,
        containing: [],
        categories: [NEW_UNKNOWN_CATEGORY_ID],
      },
      changes: {},
    };
    anCat2KindNAme[anCat.id] = anCat.name;
  }
  for (const annotation of annotations) {
    annotation.kind = anCat2KindNAme[annotation.categoryId];
    annotation.name = `${annotation.imageId}-${annotation.kind}`;
    annotation.categoryId = NEW_UNKNOWN_CATEGORY_ID;
    things.ids.push(annotation.id);
    things.entities[annotation.id] = {
      saved: annotation as NewAnnotationType,
      changes: {},
    };

    kinds.entities[annotation.kind].saved.containing.push(annotation.id);
  }
  preloadedState.newData = { kinds, categories, things };
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
        console.log("Failed to load preloaded state");
        setPreloaded({ isReady: true, state: undefined });
      });
  }, [setPreloaded]);

  return preloaded.isReady ? (
    <Provider store={initStore(preloaded.state)}>{children}</Provider>
  ) : (
    <></>
  );
};
