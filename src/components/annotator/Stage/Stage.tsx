import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Provider, useDispatch, useSelector, useStore } from "react-redux";
import Konva from "konva";
import * as ReactKonva from "react-konva";
import { KonvaEventObject } from "konva/lib/Node";
import throttle from "lodash/throttle";
import { DndProvider } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";

import {
  useAnnotatorKeyboardShortcuts,
  useAnnotationTool,
  useCursor,
  useHandTool,
  usePointer,
  useWindowFocusHandler,
  useZoom,
} from "hooks";

import { Image } from "./Image";
import { Selection } from "./Selection";
import { Layer } from "./Layer";
import { ZoomSelection } from "./Selection/ZoomSelection";
import { PenAnnotationToolTip } from "./PenAnnotationToolTip/PenAnnotationToolTip";
import { Annotations } from "./Annotations";
import { PointerSelection } from "./Selection/PointerSelection";
import { SoundEvents } from "./sound-events";

import {
  AnnotatorSlice,
  stagedAnnotationsSelector,
  scaledImageHeightSelector,
  scaledImageWidthSelector,
  workingAnnotationSelector,
  selectedAnnotationsIdsSelector,
  selectionModeSelector,
  stageHeightSelector,
  stagePositionSelector,
  stageScaleSelector,
  stageWidthSelector,
  toolTypeSelector,
  activeImagePlaneSelector,
  annotationStateSelector,
  cursorSelector,
  setSelectedAnnotations,
} from "store/annotator";
import { selectedCategorySelector } from "store/common";

import {
  AnnotationModeType,
  AnnotationStateType,
  decodedAnnotationType,
  Point,
  ToolType,
} from "types";

import { ObjectAnnotationTool, Tool } from "annotator-tools";
import { dimensions } from "utils/common";
import { Box, Typography } from "@mui/material";

export const Stage = () => {
  /*
    Konva's Stage is implemented such that its children are not connected,
    and the store is no longer available to them, so we need to reinject
    it to the Provider as a child of Stage.
    See: https://github.com/konvajs/react-konva/issues/311
    Discussion linked to above recommends use of
    ReactReduxContext.Consumer -> Stage -> Provider pattern,
    but that is not a publi API and may break in the future:
    https://react-redux.js.org/using-react-redux/accessing-store#using-reactreduxcontext-directly
    Here useStore() is utilized instead of getting the store
    from ReactReduxContext.Consumer, which has the same result, but is safer.
   */
  const store = useStore();

  // useState
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
  const [outOfBounds, setOutOfBounds] = useState<boolean>(false);

  // useRef
  const imageRef = useRef<Konva.Image | null>(null);
  const stageRef = useRef<Konva.Stage>(null);

  const saveLabelRef = useRef<Konva.Label>();
  const clearLabelRef = useRef<Konva.Label>();

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

  // useHook
  const dispatch = useDispatch();
  const {
    deselect: onZoomDeselect,
    onMouseUp: onZoomMouseUp,
    onMouseMove: onZoomMouseMove,
    onMouseDown: onZoomMouseDown,
    onWheel: onZoomWheel,
  } = useZoom();
  const {
    onMouseDown: onPointerMouseDown,
    onMouseMove: onPointerMouseMove,
    onMouseUp: onPointerMouseUp,
  } = usePointer();

  const [annotationTool] = useAnnotationTool();
  const { draggable } = useHandTool();
  useCursor();
  useWindowFocusHandler();

  // helper functions

  /**
   * Takes the current pointer position in the browser window and coverts it to
   *  coordinates relative to the image in the stage
   * @param position  position of cursor in the window
   * @returns {Point}  position of cursor in relation to stage
   */
  const getRelativePointerPosition = useCallback(
    (position: { x: number; y: number }): Point | undefined => {
      if (!imageRef || !imageRef.current) return;

      const transform = imageRef.current.getAbsoluteTransform().copy();

      transform.invert();

      return transform.point(position);
    },
    [imageRef]
  );

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
      AnnotatorSlice.actions.setStagedAnnotations({
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
        AnnotatorSlice.actions.setAnnotationState({
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
        AnnotatorSlice.actions.setAnnotationState({
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
        AnnotatorSlice.actions.setAnnotationState({
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
        AnnotatorSlice.actions.setAnnotationState({
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
      event.target.getParent().className === "Transformer"
    )
      return;
    memoizedOnMouseDown();
  };

  const memoizedOnMouseDown = useMemo(() => {
    const func = () => {
      if (!firstMouseDown) {
        setFirstMouseDown(true);
      }
      if (toolType === ToolType.Hand || toolType === ToolType.ColorAdjustment)
        return;
      if (!stageRef || !stageRef.current) return;
      const position = stageRef.current.getPointerPosition();

      if (!position) return;
      const relative = getRelativePointerPosition(position);

      if (!relative) return;
      if (saveLabelRef?.current?.getText() && clearLabelRef.current) {
        //do not proceed with mouse down events if user has clicked on Save Annotation button
        if (
          (relative.x <
            saveLabelRef.current.x() + saveLabelRef.current.width() &&
            relative.x > saveLabelRef.current.x() &&
            relative.y <
              saveLabelRef.current.y() + saveLabelRef.current.height() &&
            relative.y > saveLabelRef.current.y()) ||
          (relative.x <
            clearLabelRef.current.x() + clearLabelRef.current.width() &&
            relative.x > clearLabelRef.current.x() &&
            relative.y <
              clearLabelRef.current.y() + clearLabelRef.current.height() &&
            relative.y > clearLabelRef.current.y())
        ) {
          return;
        }
      }

      if (toolType === ToolType.Pointer) {
        onPointerMouseDown(relative);
        return;
      }

      const rawImagePosition = {
        x: relative.x / stageScale,
        y: relative.y / stageScale,
      };

      if (toolType === ToolType.Zoom) {
        onZoomMouseDown(relative);
      } else {
        if (annotationState === AnnotationStateType.Annotated) {
          deselectAnnotation();
          if (selectionMode === AnnotationModeType.New) {
            deselectAllAnnotations();
            return;
          }
        }

        if (!annotationTool) return;
        annotationTool.onMouseDown(rawImagePosition);
      }
    };
    const throttled = throttle(func, 5);
    return () => throttled();
  }, [
    annotationState,
    annotationTool,
    saveLabelRef,
    selectionMode,
    toolType,
    deselectAllAnnotations,
    deselectAnnotation,
    onPointerMouseDown,
    onZoomMouseDown,
    stageScale,
    firstMouseDown,
    getRelativePointerPosition,
  ]);

  const onMouseMove = useMemo(() => {
    const func = (
      event: KonvaEventObject<MouseEvent> | KonvaEventObject<TouchEvent>
    ) => {
      process.env.NODE_ENV !== "production" &&
        process.env.REACT_APP_LOG_LEVEL === "3" &&
        console.log(event);

      if (!stageRef || !stageRef.current || !annotationTool) return;

      const position = stageRef.current.getPointerPosition();

      if (!position) return;

      const relative = getRelativePointerPosition(position);

      const image = annotationTool.image;
      if (!relative || !scaledImageWidth || !scaledImageHeight) return;
      setCurrentPosition(relative);
      const absolute = {
        x: Math.round(relative.x / stageScale),
        y: Math.round(relative.y / stageScale),
      };

      // Add a little leeway around the canvas to aid drawing up to the edges
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
      if (toolType === ToolType.ColorAdjustment) return;

      if (toolType === ToolType.Zoom) {
        onZoomMouseMove(relative);
      } else if (toolType === ToolType.Pointer) {
        onPointerMouseMove(relative);
      } else {
        if (!annotationTool) return;
        annotationTool.onMouseMove(absolute);
      }
    };
    const throttled = throttle(func, 5);
    return (
      event: KonvaEventObject<MouseEvent> | KonvaEventObject<TouchEvent>
    ) => throttled(event);
  }, [
    annotationTool,
    toolType,
    onPointerMouseMove,
    onZoomMouseMove,
    scaledImageHeight,
    scaledImageWidth,
    stageScale,
    getRelativePointerPosition,
  ]);

  const onMouseUp = useMemo(() => {
    const func = async (
      event: KonvaEventObject<MouseEvent> | KonvaEventObject<TouchEvent>
    ) => {
      process.env.NODE_ENV !== "production" &&
        process.env.REACT_APP_LOG_LEVEL === "2" &&
        console.log(event);

      if (!currentPosition || !absolutePosition) return;
      if (toolType === ToolType.Zoom) {
        onZoomMouseUp(currentPosition);
      } else if (toolType === ToolType.Pointer) {
        onPointerMouseUp(currentPosition);
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
    annotationTool,
    toolType,
    onPointerMouseUp,
    onZoomMouseUp,
    absolutePosition,
    currentPosition,
  ]);

  // useEffect
  /*/
  Detach transformers and selections when all annotations are removed
   */
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

  return (
    <>
      <ReactKonva.Stage
        draggable={draggable}
        height={stageHeight}
        onMouseDown={(evt) => onMouseDown(evt)}
        onTouchStart={(evt) => onMouseDown(evt)}
        onMouseMove={(evt) => onMouseMove(evt)}
        onTouchMove={(evt) => onMouseMove(evt)}
        onMouseUp={(evt) => onMouseUp(evt)}
        onTouchEnd={(evt) => onMouseUp(evt)}
        onWheel={(evt) => onZoomWheel(evt)}
        position={stagePosition}
        ref={stageRef}
        width={stageWidth}
      >
        <Provider store={store}>
          <DndProvider backend={HTML5Backend}>
            <Layer>
              <Image ref={imageRef} />

              <ZoomSelection />

              {!(
                annotationState !== AnnotationStateType.Annotating &&
                toolType !== ToolType.QuickAnnotation
              ) && <Selection tool={tool} toolType={toolType} />}

              <PenAnnotationToolTip
                currentPosition={currentPosition}
                annotating={annotationState === AnnotationStateType.Annotating}
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
      {/* SoundEvents must be mounted following some user gesture
          else an "AudioContext was not allowed to start" warning
          will be issued by Chrome*/}
      {firstMouseDown && <SoundEvents />}
    </>
  );
};
