import { useContext, useEffect, useRef, useState } from "react";
import { Provider, useDispatch, useSelector, useStore } from "react-redux";
import Konva from "konva";
import * as ReactKonva from "react-konva";
import { DndProvider } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";
import { Box, Typography } from "@mui/material";

import { useHotkeys, usePointerLocation } from "hooks";
import { useAnnotationState } from "hooks/useAnnotationState";
import { Cursor } from "components/styled-components";

import { Layer } from "./Layer";
import { Selection } from "./Selection";
import { Annotations } from "./Annotations";

import { imageViewerSlice } from "store/imageViewer";
import {
  selectAnnotationState,
  selectToolType,
} from "store/annotator/selectors";

import { dimensions } from "utils/common/constants";
import { Image } from "./Image";
import { selectActiveImage } from "store/imageViewer/reselectors";
import { useStageHandlers, useAnnotationTool } from "hooks";
import { StageContext } from "contexts";
import { AnnotationState, ToolType } from "utils/annotator/enums";
import { HotkeyView } from "utils/common/enums";
import {
  selectActiveImageId,
  selectActiveImageRenderedSrcs,
  selectImageIsloading,
  selectStagePosition,
} from "store/imageViewer/selectors";

const normalizeFont = 1300;

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
  const [htmlImages, setHtmlImages] = useState<HTMLImageElement[]>([]);
  // useRef
  const imageRef = useRef<Konva.Image | null>(null);
  const stageRef = useContext(StageContext);

  // useSelector
  const toolType = useSelector(selectToolType);
  const stagePosition = useSelector(selectStagePosition);
  const imageIsLoading = useSelector(selectImageIsloading);
  const annotationState = useSelector(selectAnnotationState);
  const renderedSrcs = useSelector(selectActiveImageRenderedSrcs);
  const activeImageId = useSelector(selectActiveImageId);
  const activeImage = useSelector(selectActiveImage);

  const { annotationTool } = useAnnotationTool();
  useAnnotationState(annotationTool);

  const {
    absolutePosition,
    outOfBounds,
    setCurrentMousePosition,
    positionByStage,
    pixelColor,
  } = usePointerLocation(imageRef, stageRef!, annotationTool.image);

  const {
    handleMouseUp,
    handleMouseDown,
    handleMouseMove,
    handleTouchMove,
    handleDblClickToZoom,
    handleZoomWheel,
  } = useStageHandlers(
    stageRef,
    annotationTool,
    positionByStage,
    absolutePosition,
    draggable,
    annotationState,
    outOfBounds,
    setCurrentMousePosition
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
      })
    );
  }, [draggable, stageRef, dispatch, stageHeight, stageWidth]);

  useEffect(() => {
    if (!activeImage?.shape) return;
    dispatch(
      imageViewerSlice.actions.setImageOrigin({
        origin: {
          x: (stageWidth - activeImage.shape.width) / 2,
          y: (stageHeight - activeImage.shape.height) / 2,
        },
      })
    );
  }, [stageWidth, stageHeight, activeImage?.shape, dispatch]);

  useEffect(() => {
    setHtmlImages(
      renderedSrcs.map((src: string) => {
        const imgElem = document.createElement("img");
        imgElem.src = src;
        return imgElem;
      })
    );
  }, [renderedSrcs, stageRef, dispatch]);

  useEffect(() => {
    stageRef?.current?.scale({ x: 1, y: 1 });
    dispatch(
      imageViewerSlice.actions.setStagePosition({
        stagePosition: { x: 0, y: 0 },
      })
    );
  }, [activeImageId, stageRef, dispatch]);

  useHotkeys(
    "alt",
    (event) => {
      setDraggable(event.type === "keydown" ? true : false);
    },
    HotkeyView.Annotator,
    { keydown: true, keyup: true }
  );

  return (
    <>
      <ReactKonva.Stage
        draggable={draggable}
        height={stageHeight}
        onMouseDown={(evt) => handleMouseDown(evt)}
        onTouchStart={(evt) => handleMouseDown(evt)}
        onMouseMove={(evt) => handleMouseMove(evt)}
        onTouchMove={(evt) => handleTouchMove(evt)}
        onMouseUp={(evt) => handleMouseUp(evt)}
        onTouchEnd={(evt) => handleMouseUp(evt)}
        onWheel={(evt) => handleZoomWheel(evt)}
        onDblClick={(evt) => handleDblClickToZoom(evt)}
        position={stagePosition}
        ref={stageRef}
        width={stageWidth}
      >
        <Provider store={store}>
          <StageContext.Provider value={stageRef}>
            <DndProvider backend={HTML5Backend}>
              <Layer>
                {!(htmlImages && htmlImages.length) ? (
                  <ReactKonva.Text
                    x={stageWidth / 6} //center depending on window width
                    y={0.4 * stageHeight}
                    width={(2 * stageWidth) / 3}
                    align="center"
                    text={
                      'To start annotating, drag and drop an image onto the canvas or click on "Open Image".'
                    }
                    fill={"black"}
                    fontSize={(30 * stageWidth) / normalizeFont} //scale font depending on window width
                  />
                ) : !imageIsLoading ? (
                  <Image
                    ref={imageRef}
                    images={htmlImages}
                    stageHeight={stageHeight}
                    stageWidth={stageWidth}
                  />
                ) : (
                  <></>
                )}
                {(annotationState === AnnotationState.Annotating ||
                  toolType === ToolType.QuickAnnotation) && ( //TODO: remind myself why quick annotation special
                  <Selection tool={annotationTool} toolType={toolType} />
                )}
                <Cursor
                  positionByStage={positionByStage}
                  absolutePosition={absolutePosition}
                  annotationState={annotationState}
                  outOfBounds={outOfBounds}
                  draggable={draggable}
                  toolType={toolType}
                />
                {!imageIsLoading && (
                  <Annotations annotationTool={annotationTool} />
                )}
              </Layer>
            </DndProvider>
          </StageContext.Provider>
        </Provider>
      </ReactKonva.Stage>
      <Box
        sx={{
          width: stageWidth - 24,
          height: dimensions.stageInfoHeight,
          justifyContent: "space-between",
          alignItems: "center",
          display: "flex",
          pr: "1.5rem",
        }}
      >
        {!outOfBounds && absolutePosition && (
          <>
            <Typography>{`x: ${absolutePosition.x} y: ${absolutePosition.y} `}</Typography>
            <Typography>{pixelColor}</Typography>
          </>
        )}
      </Box>
    </>
  );
};
