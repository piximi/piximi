import { useContext, useEffect, useMemo, useRef, useState } from "react";

import { Provider, useDispatch, useSelector, useStore } from "react-redux";
import { Stage as KonvaStage } from "react-konva";

import { Box, Typography } from "@mui/material";

import { useHotkeys } from "hooks";

import { AnnotationState, ToolType } from "views/ImageViewer/utils/enums";

import { HotkeyContext } from "utils/enums";

import {
  useStageHandlers,
  usePointerLocation,
  useAnnotationTool,
} from "../../hooks";

import { Cursor } from "./Cursor";
import { Layer, ImageLayer } from "./layers";
import { Selection } from "./Selection";
import { Annotations } from "./Annotations";
import { StageContext } from "../../state/StageContext";
import { imageViewerSlice } from "../../state/imageViewer";
import {
  selectAnnotationState,
  selectToolType,
} from "../../state/annotator/selectors";
import { selectStagePosition } from "../../state/imageViewer/selectors";

import type Konva from "konva";
import { useParameterizedSelector } from "store/hooks";
import { selectExtendedImageById } from "store/dataV2/selectors";
import { selectActiveImageId } from "@ImageViewer/state/image-viewer-data/selectors";
import { ActiveImageInfoStrip } from "./ActiveImageInfoStrip";
import { useActiveImage } from "@ImageViewer/contexts/ActiveImageProvider";
import useImage from "use-image";

export const Stage = ({
  stageWidth,
  stageHeight,
}: {
  stageWidth: number;
  stageHeight: number;
}) => {
  const store = useStore();
  const dispatch = useDispatch();

  const [draggable, setDraggable] = useState<boolean>(false);
  // useRef
  const imageRef = useRef<Konva.Image | null>(null);
  const stageRef = useContext(StageContext);

  // useSelector
  const toolType = useSelector(selectToolType);
  const stagePosition = useSelector(selectStagePosition);
  const annotationState = useSelector(selectAnnotationState);

  const { imageSrc } = useActiveImage();

  const [imageEl] = useImage(imageSrc);

  const activeImageId = useSelector(selectActiveImageId);
  const image = useParameterizedSelector(
    selectExtendedImageById,
    activeImageId ?? "",
  );

  const { annotationTool } = useAnnotationTool(imageSrc);

  const {
    absolutePosition,
    outOfBounds,
    setCurrentMousePosition,
    relativePositionByStage,
    pixelColor,
    getAbsolutePosition,
    getPositionRelativeToStage,
  } = usePointerLocation(imageRef, stageRef!, annotationTool.image);

  const {
    handleMouseUp,
    handleMouseDown,
    handleMouseMove,
    handleTouchMove,
    handleDblClickToZoom,
    handleZoomWheel,
    handleTouchStart,
    handleTouchEnd,
  } = useStageHandlers(
    stageRef,
    annotationTool,
    relativePositionByStage,
    absolutePosition,
    draggable,
    setDraggable,
    annotationState,
    outOfBounds,
    setCurrentMousePosition,
    getAbsolutePosition,
    getPositionRelativeToStage,
  );

  useEffect(() => {
    if (!stageRef || !stageRef.current) return;
    const stage = stageRef.current;
    dispatch(
      imageViewerSlice.actions.updateZoomSelection({
        changes: {
          centerPoint: {
            x: (stageWidth / 2) * stage.scaleX() + stage.x(),
            y: (stageHeight / 2) * stage.scaleX() + stage.y(),
          },
        },
      }),
    );
  }, [draggable, stageRef, dispatch, stageHeight, stageWidth]);

  useEffect(() => {
    if (!image?.shape) return;
    dispatch(
      imageViewerSlice.actions.setImageOrigin({
        origin: {
          x: (stageWidth - image.shape.width) / 2,
          y: (stageHeight - image.shape.height) / 2,
        },
      }),
    );
  }, [
    stageWidth,
    stageHeight,
    image?.shape.width,
    image?.shape.height,
    dispatch,
  ]);

  useEffect(() => {
    stageRef?.current?.scale({ x: 1, y: 1 });
    dispatch(
      imageViewerSlice.actions.setStagePosition({
        stagePosition: { x: 0, y: 0 },
      }),
    );
  }, [activeImageId, stageRef, dispatch]);

  useHotkeys(
    "alt",
    (event) => {
      setDraggable(event.type === "keydown" ? true : false);
    },
    HotkeyContext.AnnotatorView,
    { keydown: true, keyup: true },
  );

  return (
    <Box sx={{ zIndex: 999 }}>
      <KonvaStage
        draggable={draggable}
        height={stageHeight}
        onMouseDown={(evt) => {
          handleMouseDown(evt);
        }}
        onTouchStart={(evt) => {
          handleTouchStart(evt);
        }}
        onMouseMove={(evt) => handleMouseMove(evt)}
        onTouchMove={(evt) => handleTouchMove(evt)}
        onMouseUp={(evt) => handleMouseUp(evt)}
        onTouchEnd={(evt) => handleTouchEnd(evt)}
        onWheel={(evt) => handleZoomWheel(evt)}
        onDblClick={(evt) => handleDblClickToZoom(evt)}
        on
        position={stagePosition}
        ref={stageRef}
        width={stageWidth}
      >
        <Provider store={store}>
          <StageContext.Provider value={stageRef}>
            {imageEl && <ImageLayer ref={imageRef} htmlImage={imageEl} />}
            <Layer>
              {(annotationState === AnnotationState.Annotating ||
                toolType === ToolType.QuickAnnotation) && ( //TODO: remind myself why quick annotation special
                <Selection tool={annotationTool} toolType={toolType} />
              )}
              <Cursor
                positionByStage={relativePositionByStage}
                absolutePosition={absolutePosition}
                annotationState={annotationState}
                outOfBounds={outOfBounds}
                draggable={draggable}
                toolType={toolType}
              />
              {!imageEl && <Annotations annotationTool={annotationTool} />}
            </Layer>
          </StageContext.Provider>
        </Provider>
      </KonvaStage>
      <ActiveImageInfoStrip
        absolutePosition={absolutePosition}
        image={image}
        width={stageWidth}
        show={!outOfBounds}
      />
    </Box>
  );
};
