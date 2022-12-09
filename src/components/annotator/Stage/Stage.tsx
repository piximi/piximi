import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Provider, useDispatch, useSelector, useStore } from "react-redux";
import Konva from "konva";
import * as ReactKonva from "react-konva";
import { KonvaEventObject } from "konva/lib/Node";
import throttle from "lodash/throttle";
import { DndProvider } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";

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

import {
  activeImagePlaneSelector,
  annotationStateSelector,
  cursorSelector,
  scaledImageHeightSelector,
  scaledImageWidthSelector,
  selectedAnnotationsIdsSelector,
  selectionModeSelector,
  setStagePosition,
  setZoomSelection,
  stagedAnnotationsSelector,
  stageHeightSelector,
  stagePositionSelector,
  stageScaleSelector,
  stageWidthSelector,
  toolTypeSelector,
  workingAnnotationSelector,
  zoomSelectionSelector,
  setStagedAnnotations,
  setAnnotationState,
  setSelectedAnnotations,
} from "store/annotator";

import { zoomToolOptionsSelector } from "store/tool-options";

import {
  AnnotationModeType,
  AnnotationStateType,
  decodedAnnotationType,
  HotkeyView,
  Point,
  ToolType,
} from "types";

import { dimensions } from "utils/common";
import { Box, Typography } from "@mui/material";
import { ObjectAnnotationTool, Tool } from "annotator-tools";
import { selectedCategorySelector } from "store/common";
import { Annotations } from "./Annotations";
import { PenAnnotationToolTip } from "./PenAnnotationToolTip/PenAnnotationToolTip";
import { PointerSelection } from "./Selection/PointerSelection";

export const Stage = () => {
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
  const [annotatorPosition, setAnnotatorPosition] = useState<{
    x: number;
    y: number;
  }>();

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
  const selectedCategory = useSelector(selectedCategorySelector);
  const selectionMode = useSelector(selectionModeSelector);
  const stageHeight = useSelector(stageHeightSelector);
  const stageWidth = useSelector(stageWidthSelector);
  const stagePosition = useSelector(stagePositionSelector);
  const activeImagePlane = useSelector(activeImagePlaneSelector);
  const scaledImageWidth = useSelector(scaledImageWidthSelector);
  const scaledImageHeight = useSelector(scaledImageHeightSelector);
  const stageScale = useSelector(stageScaleSelector);
  const annotations = useSelector(stagedAnnotationsSelector);
  const annotationState = useSelector(annotationStateSelector);
  const workingAnnotation = useSelector(workingAnnotationSelector);
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
    (position: Point): Point | undefined => {
      if (!stageRef || !stageRef.current) return;

      const transform = stageRef.current.getAbsoluteTransform().copy();

      transform.invert();
      return transform.point(position);
    },
    [stageRef]
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
    setTransformedPosition(getTransformedPosition(position));
    const absolute = {
      x: Math.round(relative.x),
      y: Math.round(relative.y),
    };

    // Add a little leeway around the canvas to aid drawing up to the edges
    // console.log("position: ", position);
    // console.log("absolute: ", absolute);
    // console.log("transformed: ", getTransformedPosition(position));
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
    setAnnotatorPosition(getTransformedPosition(position));
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
    stagedAnnotations: Array<decodedAnnotationType>
  ) => {
    dispatch(
      setStagedAnnotations({
        annotations: stagedAnnotations.filter(
          (annotation) => !selectedAnnotationIds.includes(annotation.id)
        ),
      })
    );
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
      setSelectedAnnotations({
        selectedAnnotations: [],
        workingAnnotation: undefined,
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
      annotationTool?.annotate(selectedCategory, activeImagePlane);
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
    console.log(event);

    if (
      !event.target.getParent() ||
      // TODO: shouldn't be using string for className here -- Nodar
      event.target.getParent().className === "Transformer" ||
      event.target.attrs.name === "transformer-button"
    )
      return;
    memoizedOnMouseDown();
  };

  const memoizedOnMouseDown = useMemo(() => {
    const func = () => {
      if (!firstMouseDown) {
        setFirstMouseDown(true);
      }
      if (
        !currentPosition ||
        !absolutePosition ||
        draggable ||
        toolType === ToolType.ColorAdjustment
      )
        return;

      const transformed = getTransformedPosition(currentPosition);
      if (toolType === ToolType.Pointer) {
        onPointerMouseDown(transformed!);
        return;
      } else if (toolType === ToolType.Zoom) {
        onZoomMouseDown(transformed!);
        return;
      }
      if (annotationState === AnnotationStateType.Annotated) {
        deselectAnnotation();
        if (selectionMode === AnnotationModeType.New) {
          deselectAllAnnotations();
          return;
        }
      }

      if (!annotationTool) return;
      annotationTool.onMouseDown(absolutePosition);
    };
    const throttled = throttle(func, 5);
    return () => throttled();
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
  ]);

  const onMouseMove = useMemo(() => {
    const func = (event: KonvaEventObject<MouseEvent>) => {
      if (!stageRef || !stageRef.current || draggable) return;
      setCurrentMousePosition();
      if (!currentPosition) return;
      const transformed = getTransformedPosition(currentPosition);
      if (!transformed) return;
      if (toolType === ToolType.ColorAdjustment) return;

      if (toolType === ToolType.Zoom) {
        onZoomMouseMove(transformed);
      } else if (toolType === ToolType.Pointer) {
        onPointerMouseMove(transformed);
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
  ]);

  const onTouchMove = useMemo(() => {
    const func = (event: KonvaEventObject<TouchEvent>) => {
      if (!stageRef || !stageRef.current || draggable) return;
      setCurrentMousePosition();
      if (!currentPosition) return;
      const transformed = getTransformedPosition(currentPosition);
      if (!transformed) return;
      onZoomMouseMove(transformed);
      onPointerMouseMove(currentPosition);
    };
    const throttled = throttle(func, 5);
    return (event: KonvaEventObject<TouchEvent>) => throttled(event);
  }, [
    onPointerMouseMove,
    onZoomMouseMove,
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
      const transformed = getTransformedPosition(currentPosition);
      if (toolType === ToolType.Zoom) {
        onZoomMouseUp(transformed!);
        setCurrentMousePosition();
      } else if (toolType === ToolType.Pointer) {
        onPointerMouseUp(transformed!);
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
    annotationTool?.deselect();
    dispatch(
      setSelectedAnnotations({
        selectedAnnotations: [],
        workingAnnotation: undefined,
      })
    );
    setTool(annotationTool);
  }, [annotationTool, dispatch]);

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
    if (!stageRef || !stageRef.current) return;
    stageRef.current.container().style.cursor = cursor;
  }, [cursor]);

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
              <Image ref={imageRef} />

              <ZoomSelection />
              <ZoomSelection />

              {!(
                annotationState !== AnnotationStateType.Annotating &&
                toolType !== ToolType.QuickAnnotation
              ) && (
                <Selection
                  tool={tool}
                  toolType={toolType}
                  stageScale={stageRef.current?.scaleX()!}
                />
              )}

              <PenAnnotationToolTip
                currentPosition={transformedPosition}
                absolutePosition={absolutePosition}
                annotating={annotationState === AnnotationStateType.Annotating}
              />

              <PointerSelection />

              <Annotations
                transformPosition={getRelativePointerPosition}
                annotationTool={annotationTool}
                stageScale={stageRef.current?.scaleX()!}
              />
            </Layer>
          </DndProvider>
        </Provider>
      </ReactKonva.Stage>
      <Box
        sx={{
          width: stageWidth,
          height: dimensions.stageInfoHeight,
          justifyContent: "space-between",
          alignItems: "center",
          display: "flex",
        }}
      >
        {!outOfBounds && absolutePosition && (
          <>
            <Typography>
              {`x: ${absolutePosition.x} y: ${absolutePosition.y} `}
            </Typography>
            <Typography>
              {`${annotationTool.image
                .getPixelXY(absolutePosition.x, absolutePosition.y)
                .reduce((prev, next) => {
                  return prev + `${next}, `;
                }, "")
                .slice(0, -2)}`}
            </Typography>
          </>
        )}
      </Box>
    </>
  );
};
