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
  useCursor,
  useHotkeys,
  usePointer,
  useWindowFocusHandler,
  useZoom,
  useAnnotatorKeyboardShortcuts,
} from "hooks";

import { Image } from "./Image";
import { Layer } from "./Layer";
import { ZoomSelection } from "./Selection/ZoomSelection";
import { Selection } from "./Selection";
import { Annotations } from "./Annotations";
import { PenAnnotationToolTip } from "./PenAnnotationToolTip";
import { PointerSelection } from "./Selection/PointerSelection";

import {
  annotationStateSelector,
  cursorSelector,
  selectedAnnotationsIdsSelector,
  selectionModeSelector,
  setStagePosition,
  setZoomSelection,
  stagePositionSelector,
  stageScaleSelector,
  toolTypeSelector,
  zoomSelectionSelector,
  setAnnotationState,
  setSelectedAnnotationIds,
  setImageOrigin,
  selectedAnnotationCategoryIdSelector,
} from "store/imageViewer";
import {
  selectActiveImageActivePlane,
  selectStagedAnnotations,
  selectWorkingAnnotation,
  selectAnnotationCategoryById,
  selectActiveImageScaledHeight,
  selectActiveImageScaledWidth,
} from "store/data";

import { zoomToolOptionsSelector } from "store/tool-options";

import {
  AnnotationModeType,
  AnnotationStateType,
  DecodedAnnotationType,
  HotkeyView,
  Point,
  ToolType,
} from "types";

import { dimensions } from "utils/common";

import { ObjectAnnotationTool, Tool } from "annotator-tools";
import { RootState } from "store/reducer/reducer";

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
  const [tool, setTool] = useState<Tool>();
  const [currentPosition, setCurrentPosition] = useState<{
    x: number;
    y: number;
  }>();
  const [absolutePosition, setAbsolutePosition] = useState<{
    x: number;
    y: number;
  }>();
  const [transformedPosition, setTransformedPosition] = useState<{
    x: number;
    y: number;
  }>();
  const [pixelColor, setPixelColor] = useState<string>();

  const [outOfBounds, setOutOfBounds] = useState<boolean>(false);
  const [draggable, setDraggable] = useState<boolean>(false);

  // useRef
  const imageRef = useRef<Konva.Image | null>(null);
  const stageRef = useRef<Konva.Stage>(null);
  const saveLabelRef = useRef<Konva.Label>();
  const clearLabelRef = useRef<Konva.Label>();
  const labelGroupRef = useRef<Konva.Group>();

  // useSelector
  const toolType = useSelector(toolTypeSelector);
  const selectedAnnotationsIds = useSelector(selectedAnnotationsIdsSelector);
  const selectedAnnotationCategoryId = useSelector(
    selectedAnnotationCategoryIdSelector
  );
  const selectedCategory = useSelector((state: RootState) =>
    selectAnnotationCategoryById(state, selectedAnnotationCategoryId!)
  );
  const selectionMode = useSelector(selectionModeSelector);
  const stagePosition = useSelector(stagePositionSelector);
  const activeImagePlane = useSelector(selectActiveImageActivePlane);
  const scaledImageWidth = useSelector(selectActiveImageScaledWidth);
  const scaledImageHeight = useSelector(selectActiveImageScaledHeight);
  const stageScale = useSelector(stageScaleSelector);
  const annotations = useSelector(selectStagedAnnotations);
  const annotationState = useSelector(annotationStateSelector);
  const workingAnnotation = useSelector(selectWorkingAnnotation);
  const cursor = useSelector(cursorSelector);
  const zoomSelection = useSelector(zoomSelectionSelector);
  const automaticCentering = useSelector(zoomToolOptionsSelector);

  useHotkeys(
    "alt",
    (event) => {
      setDraggable(event.type === "keydown" ? true : false);
    },
    HotkeyView.Annotator,
    { keydown: true, keyup: true }
  );

  const {
    deselect: onZoomDeselect,
    onMouseUp: onZoomMouseUp,
    onMouseMove: onZoomMouseMove,
    onMouseDown: onZoomMouseDown,
    onWheel: onZoomWheel,
    handleDblClick: handleZoomDblClick,
  } = useZoom();
  const {
    onMouseDown: onPointerMouseDown,
    onMouseMove: onPointerMouseMove,
    onMouseUp: onPointerMouseUp,
  } = usePointer();

  const [annotationTool] = useAnnotationTool();
  useCursor();
  useWindowFocusHandler();

  const getRelativePointerPosition = useCallback(
    (position: Point): Point | undefined => {
      if (!imageRef || !imageRef.current) return;

      const transform = imageRef.current.getAbsoluteTransform().copy();

      transform.invert();

      return transform.point(position);
    },
    [imageRef]
  );

  const getTransformedPosition = useCallback(
    (position: Point, target: Konva.Node): Point | undefined => {
      if (!target) return;

      const transform = target.getAbsoluteTransform().copy();

      transform.invert();
      return transform.point(position);
    },
    []
  );

  const setCurrentMousePosition = useCallback(() => {
    if (
      !stageRef.current ||
      !annotationTool ||
      !scaledImageWidth ||
      !scaledImageHeight
    )
      return;
    const position = stageRef.current.getPointerPosition();

    if (!position) return;

    const relative = getRelativePointerPosition(position);

    const image = annotationTool.image;
    if (!relative || !image) return;
    setCurrentPosition(position);
    setTransformedPosition(getTransformedPosition(position, stageRef.current));
    const absolute = {
      x: Math.round(relative.x),
      y: Math.round(relative.y),
    };

    if (
      absolute.x < 0 ||
      absolute.x > image.width ||
      absolute.y < 0 ||
      absolute.y > image.height
    ) {
      setOutOfBounds(true);
      absolute.x =
        absolute.x < 0
          ? 0
          : absolute.x > image.width
          ? image.width
          : absolute.x;
      absolute.y =
        absolute.y < 0
          ? 0
          : absolute.y > image.height
          ? image.height
          : absolute.y;
    } else {
      setOutOfBounds(false);
    }

    setAbsolutePosition(absolute);
  }, [
    getRelativePointerPosition,
    scaledImageHeight,
    scaledImageWidth,
    annotationTool,
    getTransformedPosition,
  ]);

  const detachTransformer = (transformerId: string) => {
    if (!stageRef || !stageRef.current) return;
    const transformer = stageRef.current.findOne(`#${transformerId}`);

    if (!transformer) return;

    (transformer as Konva.Transformer).detach();
    (transformer as Konva.Transformer).getLayer()?.batchDraw();
  };

  const deleteAnnotations = (
    selectedAnnotationIds: Array<string>,
    stagedAnnotations: Array<DecodedAnnotationType>
  ) => {};

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
        setAnnotationState({
          annotationState: AnnotationStateType.Blank,
          annotationTool,
          execSaga: true,
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
        selectedAnnotationIds: [],
        workingAnnotationId: undefined,
      })
    );
  }, [dispatch]);

  const onAnnotating = useMemo(() => {
    const func = () => {
      dispatch(
        setAnnotationState({
          annotationState: AnnotationStateType.Annotating,
          annotationTool,
          execSaga: true,
        })
      );
    };
    return func;
  }, [annotationTool, dispatch]);

  const onAnnotated = useMemo(() => {
    const func = () => {
      dispatch(
        setAnnotationState({
          annotationState: AnnotationStateType.Annotated,
          annotationTool,
          execSaga: true,
        })
      );

      if (selectionMode !== AnnotationModeType.New) return;
      annotationTool?.annotate(selectedCategory!, activeImagePlane!);
    };
    return func;
  }, [
    annotationTool,
    selectedCategory,
    activeImagePlane,
    selectionMode,
    dispatch,
  ]);

  const onDeselect = useMemo(() => {
    const func = () => {
      dispatch(
        setAnnotationState({
          annotationState: AnnotationStateType.Blank,
          annotationTool,
          execSaga: true,
        })
      );
    };
    return func;
  }, [annotationTool, dispatch]);

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
        !currentPosition ||
        !absolutePosition ||
        draggable ||
        toolType === ToolType.ColorAdjustment
      )
        return;

      const transformed = getTransformedPosition(
        currentPosition,
        stageRef.current
      );
      if (toolType === ToolType.Pointer) {
        onPointerMouseDown(absolutePosition!);
        return;
      } else if (toolType === ToolType.Zoom) {
        onZoomMouseDown(transformed!, event);
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
      console.log(outOfBounds);
      annotationTool.onMouseDown(absolutePosition);
    };
    const throttled = throttle(func, 5);
    return (event: KonvaEventObject<MouseEvent>) => throttled(event);
  }, [
    onPointerMouseDown,
    onZoomMouseDown,
    currentPosition,
    absolutePosition,
    getTransformedPosition,
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
      if (!currentPosition) return;
      const transformed = getTransformedPosition(
        currentPosition,
        stageRef.current
      );
      if (!transformed) return;
      if (toolType === ToolType.ColorAdjustment) return;

      if (toolType === ToolType.Zoom) {
        onZoomMouseMove(transformed, event);
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
    onZoomMouseMove,
    setCurrentMousePosition,
    currentPosition,
    draggable,
    getTransformedPosition,
    annotationTool,
    toolType,
    absolutePosition,
  ]);

  const onTouchMove = useMemo(() => {
    const func = (event: KonvaEventObject<TouchEvent>) => {
      if (!stageRef || !stageRef.current || draggable) return;
      setCurrentMousePosition();
      if (!currentPosition) return;
      const transformed = getTransformedPosition(
        currentPosition,
        stageRef.current
      );
      if (!transformed) return;
      onPointerMouseMove(currentPosition);
    };
    const throttled = throttle(func, 5);
    return (event: KonvaEventObject<TouchEvent>) => throttled(event);
  }, [
    onPointerMouseMove,
    setCurrentMousePosition,
    currentPosition,
    draggable,
    getTransformedPosition,
  ]);

  const onMouseUp = useMemo(() => {
    const func = async (
      event: KonvaEventObject<MouseEvent> | KonvaEventObject<TouchEvent>
    ) => {
      if (!currentPosition || !absolutePosition || draggable) return;
      const transformed = getTransformedPosition(
        currentPosition,
        stageRef.current!
      );
      if (toolType === ToolType.Zoom) {
        onZoomMouseUp(transformed!, event as KonvaEventObject<MouseEvent>);
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
    onZoomMouseUp,
    absolutePosition,
    currentPosition,
    setCurrentMousePosition,
    getTransformedPosition,
    draggable,
    annotationTool,
    toolType,
  ]);

  const handleWheel = (event: KonvaEventObject<WheelEvent>) => {
    onZoomWheel(event);
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
    if (!annotationTool) return;
    annotationTool.registerOnAnnotatedHandler(onAnnotated);
    annotationTool.registerOnAnnotatingHandler(onAnnotating);
    annotationTool.registerOnDeselectHandler(onDeselect);
  }, [annotationTool, onAnnotated, onAnnotating, onDeselect]);

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

  useEffect(() => {
    setTool(annotationTool);
  }, [annotationTool, dispatch]);

  useAnnotatorKeyboardShortcuts({
    annotations,
    annotationTool,
    deleteAnnotations,
    deselectAllAnnotations,
    deselectAllTransformers,
    deselectAnnotation,
    onZoomDeselect,
    workingAnnotation,
    selectedAnnotationsIds,
    selectionMode,
    toolType,
  });

  useEffect(() => {
    if (!stageRef || !stageRef.current) return;

    const stage = stageRef.current;
    dispatch(
      setZoomSelection({
        zoomSelection: {
          dragging: zoomSelection.dragging,
          maximum: zoomSelection.maximum,
          minimum: zoomSelection.minimum,
          selecting: zoomSelection.selecting,
          centerPoint: {
            x: (stageWidth / 2) * stage.scaleX() + stage.x(),
            y: (stageHeight / 2) * stage.scaleX() + stage.y(),
          },
        },
      })
    );
    dispatch(
      setStagePosition({
        stagePosition: { x: stage.x(), y: stage.y() },
      })
    );
  }, [
    draggable,
    stageRef,
    dispatch,
    stageHeight,
    stageWidth,
    zoomSelection.dragging,
    zoomSelection.maximum,
    zoomSelection.minimum,
    zoomSelection.selecting,
    automaticCentering,
  ]);

  useEffect(() => {
    if (!stageRef || !stageRef.current) return;
    if (draggable) {
      stageRef.current.container().style.cursor = "grab";
    } else {
      stageRef.current.container().style.cursor = cursor;
    }
  }, [draggable, cursor, stageRef]);

  useEffect(() => {
    if (!absolutePosition || outOfBounds || !annotationTool.image) return;
    let y: number;
    /* For some reason the full range of x values work, but only y < height  work
       and when x >= width - 1, only y < height - 1 works in getPixelXY
       */
    if (absolutePosition.x >= annotationTool.image.width - 1) {
      y = Math.min(annotationTool.image.height - 2, absolutePosition.y);
    } else {
      y = Math.min(annotationTool.image.height - 1, absolutePosition.y);
    }
    setPixelColor(
      `${annotationTool.image
        .getPixelXY(absolutePosition.x, y)
        .reduce((prev, next) => {
          return prev + `${next}, `;
        }, "")
        .slice(0, -2)}`
    );
  }, [
    annotationTool,
    absolutePosition,
    absolutePosition?.x,
    absolutePosition?.y,
    outOfBounds,
  ]);

  useEffect(() => {
    if (!scaledImageHeight || !scaledImageWidth) return;
    dispatch(
      setImageOrigin({
        origin: {
          x: (stageWidth - scaledImageWidth) / 2,
          y: (stageHeight - scaledImageHeight) / 2,
        },
      })
    );
  }, [stageWidth, stageHeight, scaledImageWidth, scaledImageHeight, dispatch]);

  useEffect(() => {
    if (!stageRef || !stageRef.current) return;
    if (outOfBounds) {
      stageRef.current.container().style.cursor = "not-allowed";
    } else {
      stageRef.current.container().style.cursor = cursor;
    }
  }, [outOfBounds, cursor, stageRef]);

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
              <Image
                ref={imageRef}
                stageHeight={stageHeight}
                stageWidth={stageWidth}
              />

              <ZoomSelection />

              {!(
                annotationState !== AnnotationStateType.Annotating &&
                toolType !== ToolType.QuickAnnotation
              ) && <Selection tool={tool} toolType={toolType} />}

              <PenAnnotationToolTip
                currentPosition={transformedPosition}
                absolutePosition={absolutePosition}
                annotating={annotationState === AnnotationStateType.Annotating}
                outOfBounds={outOfBounds}
              />

              <PointerSelection />

              <Annotations
                transformPosition={getRelativePointerPosition}
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
            <Typography>
              {`x: ${absolutePosition.x} y: ${absolutePosition.y} `}
            </Typography>
            <Typography>{pixelColor}</Typography>
          </>
        )}
      </Box>
    </>
  );
};
