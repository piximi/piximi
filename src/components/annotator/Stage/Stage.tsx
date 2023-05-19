import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Provider, useDispatch, useSelector, useStore } from "react-redux";
import Konva from "konva";
import * as ReactKonva from "react-konva";
import { KonvaEventObject } from "konva/lib/Node";
import throttle from "lodash/throttle";
import { DndProvider } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";
import { Box, Typography } from "@mui/material";

import {
  useAnnotationTool,
  useHotkeys,
  usePointer,
  useWindowFocusHandler,
  useZoom,
  useAnnotatorKeyboardShortcuts,
  usePointerLocation,
} from "hooks";

import { Image } from "./Image";
import { Layer } from "./Layer";
import { ZoomSelection } from "./Selection/ZoomSelection";
import { Selection } from "./Selection";
import { Annotations } from "./Annotations";
import { PenAnnotationToolTip } from "./PenAnnotationToolTip";

import {
  cursorSelector,
  stagePositionSelector,
  stageScaleSelector,
  setSelectedAnnotationIds,
  setImageOrigin,
  selectSelectedAnnotationIds,
  activeImageRenderedSrcsSelector,
  imageViewerSlice,
} from "store/imageViewer";
import { annotatorSlice } from "store/annotator";
import {
  selectAnnotationState,
  selectAnnotationSelectionMode,
  selectToolType,
} from "store/annotator/selectors";
import {
  selectWorkingAnnotation,
  selectActiveAnnotations,
  selectActiveImageWidth,
  selectActiveImageHeight,
} from "store/data";

import {
  AnnotationModeType,
  AnnotationStateType,
  DecodedAnnotationType,
  HotkeyView,
  ToolType,
} from "types";

import { dimensions } from "utils/common";

import { ObjectAnnotationTool } from "annotator-tools";
import { useAnnotationState } from "hooks/useAnnotationState";

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
  const [firstMouseDown, setFirstMouseDown] = useState(false);

  const [draggable, setDraggable] = useState<boolean>(false);
  // useRef
  const imageRef = useRef<Konva.Image | null>(null);
  const stageRef = useRef<Konva.Stage>(null);
  const saveLabelRef = useRef<Konva.Label>();
  const clearLabelRef = useRef<Konva.Label>();
  const labelGroupRef = useRef<Konva.Group>();
  // useSelector
  const toolType = useSelector(selectToolType);
  const selectedAnnotationsIds = useSelector(selectSelectedAnnotationIds);

  const selectionMode = useSelector(selectAnnotationSelectionMode);
  const stagePosition = useSelector(stagePositionSelector);
  const imageWidth = useSelector(selectActiveImageWidth);
  const imageHeight = useSelector(selectActiveImageHeight);
  const stageScale = useSelector(stageScaleSelector);
  const annotations = useSelector(selectActiveAnnotations);
  const annotationState = useSelector(selectAnnotationState);
  const workingAnnotation = useSelector(selectWorkingAnnotation);
  const cursor = useSelector(cursorSelector);
  const renderedSrcs = useSelector(activeImageRenderedSrcsSelector);
  const [htmlImages, setHtmlImages] = useState<HTMLImageElement[]>([]);
  useHotkeys(
    "alt",
    (event) => {
      setDraggable(event.type === "keydown" ? true : false);
    },
    HotkeyView.Annotator,
    { keydown: true, keyup: true }
  );
  const {
    handleZoomDblClick,
    handleZoomMouseDown,
    handleZoomMouseMove,
    handleZoomMouseUp,
    handleZoomScroll,
    resetZoomSelection,
  } = useZoom(stageRef.current);
  const {
    onMouseDown: onPointerMouseDown,
    onMouseMove: onPointerMouseMove,
    onMouseUp: onPointerMouseUp,
  } = usePointer();
  const [annotationTool] = useAnnotationTool();
  const {
    absolutePosition,
    outOfBounds,
    setCurrentMousePosition,
    getPositionFromImage,
    positionByStage,
    pixelColor,
  } = usePointerLocation(imageRef, stageRef!, annotationTool?.image);
  useAnnotationState(annotationTool);
  useWindowFocusHandler();

  const detachTransformer = (transformerId: string) => {
    if (!stageRef || !stageRef.current) return;
    const transformer = stageRef.current.findOne(`#${transformerId}`);
    if (!transformer) return;
    (transformer as Konva.Transformer).detach();
    (transformer as Konva.Transformer).getLayer()?.batchDraw();
  };

  const deselectAllTransformers = () => {
    if (!stageRef || !stageRef.current) return;
    // const transformers = stageRef.current.find("Transformer").toArray();
    const transformers = stageRef.current.find("Transformer");
    transformers.forEach((tr: any) => {
      (tr as Konva.Transformer).detach();
      (tr as Konva.Transformer).getLayer()?.batchDraw();
    });
  };
  const deselectAnnotation = useCallback(() => {
    if (!annotationTool) {
      dispatch(
        annotatorSlice.actions.setAnnotationState({
          annotationState: AnnotationStateType.Blank,
          annotationTool,
        })
      );
      return;
    }
    annotationTool.deselect();
    if (!workingAnnotation) return;
    const transformerId = "tr-".concat(workingAnnotation.id);
    detachTransformer(transformerId);
  }, [annotationTool, workingAnnotation, dispatch]);

  const deselectAllAnnotations = useCallback(() => {
    dispatch(
      setSelectedAnnotationIds({
        annotationIds: [],
        workingAnnotationId: undefined,
      })
    );
  }, [dispatch]);
  const deleteAnnotations = (
    annotationIds: Array<string>,
    stagedAnnotations: Array<DecodedAnnotationType>
  ) => {};

  const onMouseDown = (
    event: KonvaEventObject<MouseEvent> | KonvaEventObject<TouchEvent>
  ) => {
    process.env.NODE_ENV !== "production" &&
      process.env.REACT_APP_LOG_LEVEL === "2" &&
      console.log(event);
    if (
      !event.target.getParent() ||
      // TODO: shouldn't be using string for className here -- Nodar
      event.target.getParent().className === "Transformer" ||
      event.target.attrs.name === "transformer-button"
    )
      return;
    memoizedOnMouseDown(event as KonvaEventObject<MouseEvent>);
  };
  const memoizedOnMouseDown = useMemo(() => {
    const func = (event: KonvaEventObject<MouseEvent>) => {
      if (!firstMouseDown) {
        setFirstMouseDown(true);
      }
      if (
        !stageRef ||
        !stageRef.current ||
        !positionByStage ||
        !absolutePosition ||
        draggable ||
        toolType === ToolType.ColorAdjustment
      )
        return;

      if (toolType === ToolType.Pointer) {
        onPointerMouseDown(absolutePosition!);
        return;
      } else if (toolType === ToolType.Zoom) {
        handleZoomMouseDown(positionByStage!, event);
        return;
      }
      if (annotationState === AnnotationStateType.Annotated) {
        deselectAnnotation();
        if (selectionMode === AnnotationModeType.New) {
          deselectAllAnnotations();
          return;
        }
      }
      if (!annotationTool || outOfBounds) return;
      console.log("mouseDown");
      annotationTool.onMouseDown(absolutePosition);
    };
    const throttled = throttle(func, 5);
    return (event: KonvaEventObject<MouseEvent>) => throttled(event);
  }, [
    onPointerMouseDown,
    handleZoomMouseDown,
    absolutePosition,
    positionByStage,
    draggable,
    annotationState,
    annotationTool,
    deselectAllAnnotations,
    deselectAnnotation,
    firstMouseDown,
    selectionMode,
    toolType,
    outOfBounds,
  ]);
  const onMouseMove = useMemo(() => {
    const func = (event: KonvaEventObject<MouseEvent>) => {
      if (!stageRef || !stageRef.current || draggable) return;
      setCurrentMousePosition();
      if (!positionByStage) return;
      if (toolType === ToolType.ColorAdjustment) return;
      if (toolType === ToolType.Zoom) {
        handleZoomMouseMove(positionByStage, event);
      } else if (toolType === ToolType.Pointer) {
        onPointerMouseMove(absolutePosition!);
      } else {
        if (!annotationTool) return;
        annotationTool.onMouseMove(absolutePosition!);
      }
    };
    const throttled = throttle(func, 5);
    return (event: KonvaEventObject<MouseEvent>) => throttled(event);
  }, [
    onPointerMouseMove,
    handleZoomMouseMove,
    setCurrentMousePosition,
    positionByStage,
    draggable,
    annotationTool,
    toolType,
    absolutePosition,
  ]);
  const onTouchMove = useMemo(() => {
    const func = (event: KonvaEventObject<TouchEvent>) => {
      if (!stageRef || !stageRef.current || draggable) return;
      setCurrentMousePosition();
      if (!absolutePosition) return;
      onPointerMouseMove(absolutePosition);
    };
    const throttled = throttle(func, 5);
    return (event: KonvaEventObject<TouchEvent>) => throttled(event);
  }, [
    onPointerMouseMove,
    setCurrentMousePosition,
    absolutePosition,
    draggable,
  ]);
  const onMouseUp = useMemo(() => {
    const func = async (
      event: KonvaEventObject<MouseEvent> | KonvaEventObject<TouchEvent>
    ) => {
      if (!positionByStage || !absolutePosition || draggable) return;
      if (toolType === ToolType.Zoom) {
        handleZoomMouseUp(
          positionByStage,
          event as KonvaEventObject<MouseEvent>
        );
        setCurrentMousePosition();
      } else if (toolType === ToolType.Pointer) {
        onPointerMouseUp(absolutePosition);
      } else {
        if (!annotationTool) return;
        if (toolType === ToolType.ObjectAnnotation) {
          await (annotationTool as ObjectAnnotationTool).onMouseUp(
            absolutePosition
          );
        }
        annotationTool.onMouseUp(absolutePosition);
      }
    };
    const throttled = throttle(func, 10);
    return (
      event: KonvaEventObject<MouseEvent> | KonvaEventObject<TouchEvent>
    ) => throttled(event);
  }, [
    onPointerMouseUp,
    handleZoomMouseUp,
    absolutePosition,
    positionByStage,
    setCurrentMousePosition,
    draggable,
    annotationTool,
    toolType,
  ]);
  const handleWheel = (event: KonvaEventObject<WheelEvent>) => {
    handleZoomScroll(event);
    setCurrentMousePosition();
  };
  const handleDblClick = (event: KonvaEventObject<MouseEvent>) => {
    handleZoomDblClick(event);
    setCurrentMousePosition();
  };
  useEffect(() => {
    if (annotations.length) return;
    deselectAllTransformers();
  }, [annotations, deselectAllAnnotations]);

  useEffect(() => {
    if (!stageRef || !stageRef.current) return;
    selectedAnnotationsIds.forEach((annotationId) => {
      if (!stageRef || !stageRef.current) return;
      const transformerId = "tr-".concat(annotationId);
      const transformer = stageRef.current.findOne(`#${transformerId}`);
      const line = stageRef.current.findOne(`#${annotationId}`);
      if (!line) return;
      if (!transformer) return;
      (transformer as Konva.Transformer).nodes([line]);
      const layer = (transformer as Konva.Transformer).getLayer();
      if (!layer) return;
      layer.batchDraw();
      // Not ideal but this figures out which label is which
      const label = stageRef.current.find(`#label`);
      if (label.length > 1) {
        saveLabelRef.current = label[0] as Konva.Label;
        clearLabelRef.current = label[1] as Konva.Label;
      }
      const group = stageRef.current.find("#label-group");
      labelGroupRef.current = group[0] as Konva.Group;
    });
  }, [selectedAnnotationsIds, workingAnnotation?.maskData]);

  useAnnotatorKeyboardShortcuts({
    annotations,
    annotationTool,
    deleteAnnotations,
    deselectAllAnnotations,
    deselectAllTransformers,
    deselectAnnotation,
    resetZoomSelection,
    workingAnnotation,
    selectedAnnotationsIds,
    selectionMode,
    toolType,
  });
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
    if (!stageRef || !stageRef.current) return;
    if (draggable) {
      stageRef.current.container().style.cursor = "grab";
    } else {
      if (outOfBounds) {
        stageRef.current.container().style.cursor = "not-allowed";
      } else {
        stageRef.current.container().style.cursor = cursor;
      }
    }
  }, [draggable, outOfBounds, cursor, stageRef]);

  useEffect(() => {
    if (!imageHeight || !imageWidth) return;
    dispatch(
      setImageOrigin({
        origin: {
          x: (stageWidth - imageWidth) / 2,
          y: (stageHeight - imageHeight) / 2,
        },
      })
    );
  }, [stageWidth, stageHeight, imageWidth, imageHeight, dispatch]);

  useEffect(() => {
    setHtmlImages(
      renderedSrcs.map((src: string) => {
        const imgElem = document.createElement("img");
        imgElem.src = src;
        return imgElem;
      })
    );
  }, [renderedSrcs]);
  return (
    <>
      <ReactKonva.Stage
        draggable={draggable}
        height={stageHeight}
        onMouseDown={(evt) => onMouseDown(evt)}
        onTouchStart={(evt) => onMouseDown(evt)}
        onMouseMove={(evt) => onMouseMove(evt)}
        onTouchMove={(evt) => onTouchMove(evt)}
        onMouseUp={(evt) => onMouseUp(evt)}
        onTouchEnd={(evt) => onMouseUp(evt)}
        onWheel={(evt) => handleWheel(evt)}
        onDblClick={(evt) => handleDblClick(evt)}
        position={stagePosition}
        scale={{ x: stageScale, y: stageScale }}
        ref={stageRef}
        width={stageWidth}
      >
        <Provider store={store}>
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
              ) : (
                <Image
                  ref={imageRef}
                  images={htmlImages}
                  stageHeight={stageHeight}
                  stageWidth={stageWidth}
                />
              )}
              <ZoomSelection />
              {!(
                annotationState !== AnnotationStateType.Annotating &&
                toolType !== ToolType.QuickAnnotation
              ) && <Selection tool={annotationTool} toolType={toolType} />}
              <PenAnnotationToolTip
                currentPosition={positionByStage}
                absolutePosition={absolutePosition}
                annotating={annotationState === AnnotationStateType.Annotating}
                outOfBounds={outOfBounds}
              />
              {/* <PointerSelection /> */}
              <Annotations
                transformPosition={getPositionFromImage}
                annotationTool={annotationTool}
              />
            </Layer>
          </DndProvider>
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
