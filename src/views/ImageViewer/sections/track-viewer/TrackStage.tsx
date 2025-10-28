import React, {
  useCallback,
  useContext,
  useLayoutEffect,
  useMemo,
  useState,
} from "react";
import { Provider, useDispatch, useSelector, useStore } from "react-redux";
import { useTheme } from "@mui/material";
import { Stage as KonvaStage } from "react-konva";

import {
  selectMetadataEntities,
  selectTrackletRecord,
} from "store/data/selectors";

import { StageContext } from "views/ImageViewer/state/StageContext";
import { ProtoAnnotationObject } from "views/ImageViewer/state/types";
import { imageViewerDataSlice } from "views/ImageViewer/state/image-viewer-data/ImageViewerDataSlice";
import { selectActiveTrackImageToAnnotation } from "views/ImageViewer/state/image-viewer-data/reselectors";
import {
  selectActiveMetadata,
  selectActiveTrackId,
  selectSelectedTracklets,
  selectTimeLinkingState,
} from "views/ImageViewer/state/image-viewer-data/selectors";

import { useImageLoader } from "./hooks/useImageLoader";
import { useAutoScroll } from "./hooks/useAutoScroll";
import { useTrackStageInteractions } from "./hooks/useTrackStageInteractions";
import { handleAnnotationTracking } from "./logic/trackingActions";
import { TooltipLayer } from "./components/TooltipLayer";
import { ImageLayer } from "./components/ImageLayer";
import { AnnotationLayer } from "./components/AnnotationLayer";
import { TrackProvider } from "views/ImageViewer/state/TrackContext";

/**
 * TrackStage is the main canvas component for visualizing time-series annotations.
 * It displays images horizontally across timepoints and renders annotations with
 * track-based coloring. Supports panning, zooming, and manual annotation tracking.
 */
export const TrackStage = ({
  stageWidth,
  stageHeight,
}: {
  stageWidth: number;
  stageHeight: number;
}) => {
  const store = useStore();
  const theme = useTheme();
  const dispatch = useDispatch();
  const stageRef = useContext(StageContext);

  // Redux selectors
  const activeMetadata = useSelector(selectActiveMetadata);
  const metadataEntities = useSelector(selectMetadataEntities);
  const activeTrackId = useSelector(selectActiveTrackId);
  const activeTraclIm2Ann = useSelector(selectActiveTrackImageToAnnotation);
  const manualLinkingActive = useSelector(selectTimeLinkingState);
  const tracklets = useSelector(selectTrackletRecord);
  const selectedTracks = useSelector(selectSelectedTracklets);

  // Local state
  const [stagePosition, setStagePosition] = useState({ x: 0, y: 0 });

  // Calculate global image shape
  const globalShape = useMemo(() => {
    const activeMetadataId = activeMetadata?.id;
    if (!activeMetadataId) return { width: 0, height: 0 };
    const { planes, channels, ...size } =
      metadataEntities[activeMetadataId].shape;
    return size;
  }, [metadataEntities, activeMetadata?.id]);

  // Custom hooks
  const htmlImages = useImageLoader(activeMetadata, globalShape, stageHeight);

  const { tooltipProps, handleWheel, throttledMouseMove, handleMouseOut } =
    useTrackStageInteractions(
      activeMetadata,
      globalShape,
      htmlImages,
      stageWidth,
      setStagePosition,
    );

  useAutoScroll(
    selectedTracks,
    tracklets,
    globalShape,
    htmlImages,
    stageWidth,
    stageRef,
    activeMetadata,
    setStagePosition,
  );

  // Handle annotation click (tracking or selection)
  const handleMouseClick = useCallback(
    (annotation: ProtoAnnotationObject) => {
      if (manualLinkingActive) {
        handleAnnotationTracking(
          annotation,
          activeTrackId,
          activeTraclIm2Ann,
          dispatch,
        );
      } else {
        if (!annotation.trackId) return;
        dispatch(
          imageViewerDataSlice.actions.toggleSelectedTrack(annotation.trackId),
        );
      }
    },
    [manualLinkingActive, activeTrackId, activeTraclIm2Ann, dispatch],
  );

  // Initial scale and position setup
  useLayoutEffect(() => {
    const stage = stageRef?.current;
    if (!stage || globalShape.height === 0) return;

    const center = {
      x: (stage.width() / 2) * stage.scaleX() + stage.x(),
      y: (stage.height() / 2) * stage.scaleX() + stage.y(),
    };

    const heightScale = (0.9 * globalShape.height) / stageHeight;
    const stageX = stage.x();
    const stageY = stage.y();
    const stageScale = stage.scaleX();
    const mousePointTo = {
      x: (center.x - stageX!) / stageScale,
      y: (center.y - stageY!) / stageScale,
    };

    const newPos = {
      x: 0,
      y: center.y - mousePointTo.y * heightScale,
    };
    stage.scale({ x: heightScale, y: heightScale });
    stage.position(newPos);
    setStagePosition(newPos);
  }, [globalShape, stageHeight, stageRef]);

  return (
    <KonvaStage
      draggable={true}
      width={stageWidth}
      height={stageHeight}
      onWheel={handleWheel}
      position={stagePosition}
      onMouseOut={handleMouseOut}
      onMouseMove={throttledMouseMove}
      ref={stageRef}
      style={{
        border: `1px solid ${theme.palette.divider}`,
        backgroundColor: theme.palette.background.default,
        borderRadius: "4px",
        overflow: "hidden",
      }}
    >
      <Provider store={store}>
        <StageContext.Provider value={stageRef}>
          <ImageLayer htmlImages={htmlImages} globalShape={globalShape} />
          <TrackProvider>
            <AnnotationLayer
              imageShape={globalShape}
              images={htmlImages}
              onClick={handleMouseClick}
              selectedTracks={selectedTracks}
            />
          </TrackProvider>
          <TooltipLayer
            visible={tooltipProps.visible}
            x={tooltipProps.x}
            y={tooltipProps.y}
            text={tooltipProps.text}
          />
        </StageContext.Provider>
      </Provider>
    </KonvaStage>
  );
};
