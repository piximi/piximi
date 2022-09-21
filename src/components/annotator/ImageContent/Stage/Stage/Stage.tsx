import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Provider, useDispatch, useSelector, useStore } from "react-redux";
import Konva from "konva";
import * as ReactKonva from "react-konva";
import { KonvaEventObject } from "konva/lib/Node";
import * as _ from "lodash";
import { useHotkeys } from "react-hotkeys-hook";
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

import { Image } from "../Image";
import { Selecting } from "../Selecting";
import { Layer } from "../Layer";
import { ZoomSelection } from "../Selection/ZoomSelection";
import { Transformers } from "../Transformers/Transformers";
import { PenAnnotationToolTip } from "../PenAnnotationToolTip/PenAnnotationToolTip";
import { Annotations } from "../Annotations/Annotations";
import { PointerSelection } from "../Selection/PointerSelection";

import {
  imageViewerSlice,
  imageInstancesSelector,
  scaledImageHeightSelector,
  scaledImageWidthSelector,
  selectedAnnotationSelector,
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
  activeImageIdSelector,
  selectedAnnotationsSelector,
  unselectedAnnotationsSelector,
  annotatorImagesSelector,
} from "store/image-viewer";
import { selectedCategorySelector } from "store/common";

import { AnnotationModeType, AnnotationStateType, ToolType } from "types";

import { ObjectAnnotationTool, Tool } from "annotator/image/Tool";
import { SoundEvents } from "./SoundEvents";

export const Stage = () => {
  const imageRef = useRef<Konva.Image | null>(null);
  const stageRef = useRef<Konva.Stage>(null);

  const selectingRef = useRef<Konva.Line | null>(null);

  const toolType = useSelector(toolTypeSelector);

  const selectedAnnotationsIds = useSelector(selectedAnnotationsIdsSelector);
  const selectedCategory = useSelector(selectedCategorySelector);

  const selectedAnnotations = useSelector(selectedAnnotationsSelector);
  const unselectedAnnotations = useSelector(unselectedAnnotationsSelector);
  const selectionMode = useSelector(selectionModeSelector);

  const stageHeight = useSelector(stageHeightSelector);
  const stageWidth = useSelector(stageWidthSelector);
  const stagePosition = useSelector(stagePositionSelector);

  const saveLabelRef = useRef<Konva.Label>();
  const clearLabelRef = useRef<Konva.Label>();

  const images = useSelector(annotatorImagesSelector);

  const activeImageId = useSelector(activeImageIdSelector);
  const activeImagePlane = useSelector(activeImagePlaneSelector);

  const [currentPosition, setCurrentPosition] = useState<{
    x: number;
    y: number;
  }>();

  const [firstMouseDown, setFirstMouseDown] = useState(false);

  const scaledImageWidth = useSelector(scaledImageWidthSelector);
  const scaledImageHeight = useSelector(scaledImageHeightSelector);

  const stageScale = useSelector(stageScaleSelector);

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

  const annotations = useSelector(imageInstancesSelector);

  const annotationState = useSelector(annotationStateSelector);

  const selectedAnnotation = useSelector(selectedAnnotationSelector);

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

  const deselectAllAnnotations = useCallback(() => {
    dispatch(
      setSelectedAnnotations({
        selectedAnnotations: [],
        selectedAnnotation: undefined,
      })
    );
  }, [dispatch]);

  const deselectAnnotation = useCallback(() => {
    if (!annotationTool) {
      dispatch(
        imageViewerSlice.actions.setAnnotationState({
          annotationState: AnnotationStateType.Blank,
          annotationTool,
          execSaga: true,
        })
      );

      return;
    }

    annotationTool.deselect();

    if (!selectedAnnotation) return;

    selectingRef.current = null;

    const transformerId = "tr-".concat(selectedAnnotation.id);
    detachTransformer(transformerId);
  }, [annotationTool, selectedAnnotation, dispatch]);

  const cursor = useSelector(cursorSelector);
  useCursor();

  useEffect(() => {
    if (!stageRef || !stageRef.current) return;
    stageRef.current.container().style.cursor = cursor;
  }, [cursor]);

  const onAnnotating = useMemo(() => {
    const func = () => {
      dispatch(
        imageViewerSlice.actions.setAnnotationState({
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
        imageViewerSlice.actions.setAnnotationState({
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
        imageViewerSlice.actions.setAnnotationState({
          annotationState: AnnotationStateType.Blank,
          annotationTool,
          execSaga: true,
        })
      );
    };
    return func;
  }, [annotationTool, dispatch]);

  useEffect(() => {
    if (!annotationTool) return;
    annotationTool.registerOnAnnotatedHandler(onAnnotated);
    annotationTool.registerOnAnnotatingHandler(onAnnotating);
    annotationTool.registerOnDeselectHandler(onDeselect);
  }, [annotationTool, onAnnotated, onAnnotating, onDeselect]);

  useEffect(() => {
    if (!stageRef || !stageRef.current) return;

    _.forEach(selectedAnnotationsIds, (annotationId) => {
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
  }, [selectedAnnotationsIds, selectedAnnotation?.mask]);

  const getRelativePointerPosition = (position: { x: number; y: number }) => {
    if (!imageRef || !imageRef.current) return;

    const transform = imageRef.current.getAbsoluteTransform().copy();

    transform.invert();

    return transform.point(position);
  };

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
        }

        if (selectionMode === AnnotationModeType.New) {
          deselectAllAnnotations();
        }

        if (!annotationTool) return;

        annotationTool.onMouseDown(rawImagePosition);
      }
    };
    const throttled = _.throttle(func, 5);
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
  ]);

  const onMouseMove = useMemo(() => {
    const func = (
      event: KonvaEventObject<MouseEvent> | KonvaEventObject<TouchEvent>
    ) => {
      process.env.NODE_ENV !== "production" &&
        process.env.REACT_APP_LOG_LEVEL === "2" &&
        console.log(event);

      if (!stageRef || !stageRef.current) return;

      if (toolType === ToolType.ColorAdjustment) return;

      const position = stageRef.current.getPointerPosition();

      if (!position) return;

      const relative = getRelativePointerPosition(position);

      if (!relative || !scaledImageWidth || !scaledImageHeight) return;

      if (toolType === ToolType.PenAnnotation) setCurrentPosition(relative);

      // Add a little leeway around the canvas to aid drawing up to the edges
      if (relative.x > -50 && relative.x < 0) {
        relative.x = 0;
      } else if (
        relative.x > scaledImageWidth &&
        relative.x < scaledImageWidth + 50
      ) {
        relative.x = scaledImageWidth;
      }
      if (relative.y > -50 && relative.y < 0) {
        relative.y = 0;
      } else if (
        relative.y > scaledImageHeight &&
        relative.y < scaledImageHeight + 50
      ) {
        relative.y = scaledImageHeight;
      }

      if (
        relative.x > scaledImageWidth ||
        relative.y > scaledImageHeight ||
        relative.x < 0 ||
        relative.y < 0
      )
        return;

      const rawImagePosition = {
        x: relative.x / stageScale,
        y: relative.y / stageScale,
      };

      if (toolType === ToolType.Zoom) {
        onZoomMouseMove(relative);
      } else if (toolType === ToolType.Pointer) {
        onPointerMouseMove(relative);
      } else {
        if (!annotationTool) return;

        annotationTool.onMouseMove(rawImagePosition);
      }
    };
    const throttled = _.throttle(func, 5);
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
  ]);

  const onMouseUp = useMemo(() => {
    const func = async (
      event: KonvaEventObject<MouseEvent> | KonvaEventObject<TouchEvent>
    ) => {
      process.env.NODE_ENV !== "production" &&
        process.env.REACT_APP_LOG_LEVEL === "2" &&
        console.log(event);

      if (!stageRef || !stageRef.current) return;

      const position = stageRef.current.getPointerPosition();

      if (!position) return;

      const relative = getRelativePointerPosition(position);

      if (!relative) return;

      const rawImagePosition = {
        x: relative.x / stageScale,
        y: relative.y / stageScale,
      };

      if (toolType === ToolType.Zoom) {
        onZoomMouseUp(relative);
      } else if (toolType === ToolType.Pointer) {
        onPointerMouseUp(relative);
      } else {
        if (!annotationTool) return;

        if (!relative || !scaledImageWidth || !scaledImageHeight) return;

        if (toolType === ToolType.ObjectAnnotation) {
          await (annotationTool as ObjectAnnotationTool).onMouseUp(
            rawImagePosition
          );
        }
        annotationTool.onMouseUp(rawImagePosition);
      }
    };
    const throttled = _.throttle(func, 10);

    return (
      event: KonvaEventObject<MouseEvent> | KonvaEventObject<TouchEvent>
    ) => throttled(event);
  }, [
    annotationTool,
    toolType,
    onPointerMouseUp,
    onZoomMouseUp,
    scaledImageHeight,
    scaledImageWidth,
    stageScale,
  ]);

  const confirmAnnotations = () => {
    if (
      !selectedAnnotation ||
      !annotationTool ||
      annotationTool.annotationState === AnnotationStateType.Annotating ||
      !activeImageId
    )
      return;

    if (
      toolType === ToolType.PolygonalAnnotation ||
      toolType === ToolType.LassoAnnotation
    ) {
      annotationTool.connect();
    }

    dispatch(
      imageViewerSlice.actions.setImageInstances({
        instances: [...unselectedAnnotations, ...selectedAnnotations],
        imageId: activeImageId,
      })
    );

    deselectAnnotation();

    if (selectionMode !== AnnotationModeType.New)
      dispatch(
        imageViewerSlice.actions.setSelectionMode({
          selectionMode: AnnotationModeType.New,
        })
      );

    if (!selectedAnnotationsIds.length) return;

    deselectAllAnnotations();
    deselectAllTransformers();
  };

  useHotkeys(
    "enter",
    () => {
      confirmAnnotations();
    },
    [
      activeImageId,
      annotations,
      annotationTool,
      annotationTool?.annotationState,
      selectedAnnotations,
      unselectedAnnotations,
      selectionMode,
      selectedAnnotationsIds,
      toolType,
    ]
  );

  useHotkeys(
    "escape",
    () => {
      if (!annotationTool) return;

      deselectAllAnnotations();
      deselectAllTransformers();

      deselectAnnotation();

      if (toolType !== ToolType.Zoom) return;
      onZoomDeselect();
    },
    [annotations, annotationTool, toolType]
  );

  useHotkeys(
    "backspace, delete",
    () => {
      dispatch(
        imageViewerSlice.actions.deleteImageInstances({
          ids: selectedAnnotationsIds,
        })
      );
      deselectAllAnnotations();
      deselectAllTransformers();

      deselectAnnotation();
    },
    [selectedAnnotationsIds, annotations]
  );

  useHotkeys(
    "up",
    () => {
      if (!activeImageId) {
        return;
      }

      const activeImageIdx = images.findIndex(
        (image) => image.id === activeImageId
      );
      if (activeImageIdx < 1) {
        return;
      }

      const newActiveImageId = images[activeImageIdx - 1].id;
      dispatch(
        imageViewerSlice.actions.setActiveImage({
          imageId: newActiveImageId,
          execSaga: true,
        })
      );
    },
    [images, activeImageId]
  );

  useHotkeys(
    "down",
    () => {
      if (!activeImageId) {
        return;
      }

      const activeImageIdx = images.findIndex(
        (image) => image.id === activeImageId
      );
      if (activeImageIdx === -1 || activeImageIdx === images.length - 1) {
        return;
      }

      const newActiveImageId = images[activeImageIdx + 1].id;
      dispatch(
        imageViewerSlice.actions.setActiveImage({
          imageId: newActiveImageId,
          execSaga: true,
        })
      );
    },
    [images, activeImageId]
  );

  /*/
  Detach transformers and selections when all annotations are removed
   */
  useEffect(() => {
    if (annotations.length) return;

    deselectAllTransformers();
  }, [annotations, deselectAllAnnotations]);

  const [tool, setTool] = useState<Tool>();

  useEffect(() => {
    setTool(annotationTool);
  }, [annotationTool, toolType]);

  useAnnotatorKeyboardShortcuts({
    annotations,
    annotationTool,
    deselectAllAnnotations,
    deselectAllTransformers,
    deselectAnnotation,
    onZoomDeselect,
    selectedAnnotation,
    selectedAnnotationsIds,
    selectionMode,
    toolType,
  });

  const { draggable } = useHandTool();

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

              <Selecting tool={tool!} />

              <PenAnnotationToolTip
                currentPosition={currentPosition}
                annotating={annotationState === AnnotationStateType.Annotating}
              />

              <PointerSelection />

              <Annotations />

              <Transformers
                transformPosition={getRelativePointerPosition}
                annotationTool={annotationTool}
              />
            </Layer>
          </DndProvider>
        </Provider>
      </ReactKonva.Stage>
      {/* SoundEvents must be mounted following some user gesture
          else an "AudioContext was not allowed to start" warning
          will be issued by Chrome*/}
      {firstMouseDown && <SoundEvents />}
    </>
  );
};
