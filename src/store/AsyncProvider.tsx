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

import { initStore } from "./productionStore";
import { Provider } from "react-redux";
import { logger } from "utils/common/helpers";
import { SerializedFileType } from "utils/file-io/types";
import { loadExampleImage } from "utils/file-io/loadExampleImage";
import { OldCategory, OldImageType, OldAnnotationType } from "./data/types";
import { measurementsSlice } from "./measurements/measurementsSlice";
import { dataConverter_v1v2 } from "utils/file-io/converters/dataConverter_v1v2";

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
    annotations: OldAnnotationType[];
  };

  preloadedState.data = dataConverter_v1v2({
    images: [image],
    oldCategories: [],
    annotations,
    annotationCategories,
  });
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
