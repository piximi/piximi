import * as ReactKonva from "react-konva";
import * as _ from "lodash";
import Konva from "konva";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ToolType } from "../../../../../types/ToolType";
import {
  imageInstancesSelector,
  selectedCategorySelector,
  selectionModeSelector,
  stageHeightSelector,
  stageScaleSelector,
  stageWidthSelector,
  toolTypeSelector,
} from "../../../../../store/selectors";
import { Provider, useDispatch, useSelector, useStore } from "react-redux";
import {
  useAnnotationTool,
  useCursor,
  useHandTool,
  useZoom,
} from "../../../../../hooks";
import { penSelectionBrushSizeSelector } from "../../../../../store/selectors/penSelectionBrushSizeSelector";
import { AnnotationModeType } from "../../../../../types/AnnotationModeType";
import { Image } from "../Image";
import { Selecting } from "../Selecting";
import { annotationStateSelector } from "../../../../../store/selectors/annotationStateSelector";
import { AnnotationStateType } from "../../../../../types/AnnotationStateType";
import {
  ObjectAnnotationTool,
  Tool,
} from "../../../../../annotator/image/Tool";
import useSound from "use-sound";
import createAnnotationSoundEffect from "../../../../../annotator/sounds/pop-up-on.mp3";
import deleteAnnotationSoundEffect from "../../../../../annotator/sounds/pop-up-off.mp3";
import { soundEnabledSelector } from "../../../../../store/selectors/soundEnabledSelector";
import { Layer } from "../Layer";
import { ZoomSelection } from "../Selection/ZoomSelection";
import { useAnnotatorKeyboardShortcuts } from "../../../../../hooks/useKeyboardShortcuts";
import { selectedAnnotationSelector } from "../../../../../store/selectors/selectedAnnotationSelector";
import { selectedAnnotationsIdsSelector } from "../../../../../store/selectors/selectedAnnotationsIdsSelector";
import { Transformers } from "../Transformers/Transformers";
import { useWindowFocusHandler } from "../../../../../hooks/useWindowFocusHandler/useWindowFocusHandler";
import { stagePositionSelector } from "../../../../../store/selectors/stagePositionSelector";
import { KonvaEventObject } from "konva/lib/Node";
import { scaledImageWidthSelector } from "../../../../../store/selectors/scaledImageWidthSelector";
import { scaledImageHeightSelector } from "../../../../../store/selectors/scaledImageHeightSelector";
import { PenAnnotationToolTip } from "../PenAnnotationToolTip/PenAnnotationToolTip";
import { selectedAnnotationsSelector } from "../../../../../store/selectors/selectedAnnotationsSelector";
import { Annotations } from "../Annotations/Annotations";
import { unselectedAnnotationsSelector } from "../../../../../store/selectors/unselectedAnnotationsSelector";
import { quickSelectionRegionSizeSelector } from "../../../../../store/selectors/quickSelectionRegionSizeSelector";
import { useHotkeys } from "react-hotkeys-hook";
import { PointerSelection } from "../Selection/PointerSelection";
import { usePointer } from "../../../../../hooks/usePointer/usePointer";
import { DndProvider } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";
import { cursorSelector } from "../../../../../store/selectors/cursorSelector";
import {
  imageViewerSlice,
  setSelectedAnnotations,
} from "../../../../../store/slices";
import { activeImageIdSelector } from "../../../../../store/selectors/activeImageIdSelector";
import { activeImagePlaneSelector } from "../../../../../store/selectors/activeImagePlaneSelector";
import { annotatorImagesSelector } from "store/selectors/annotatorImagesSelector";

export const Stage = () => {
  const imageRef = useRef<Konva.Image | null>(null);
  const stageRef = useRef<Konva.Stage>(null);

  const selectingRef = useRef<Konva.Line | null>(null);

  const toolType = useSelector(toolTypeSelector);

  const penSelectionBrushSize = useSelector(penSelectionBrushSizeSelector);
  const selectedAnnotationsIds = useSelector(selectedAnnotationsIdsSelector);
  const quickSelectionBrushSize = useSelector(quickSelectionRegionSizeSelector);
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

  const [playCreateAnnotationSoundEffect] = useSound(
    createAnnotationSoundEffect
  );
  const [playDeleteAnnotationSoundEffect] = useSound(
    deleteAnnotationSoundEffect
  );

  const soundEnabled = useSelector(soundEnabledSelector);

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
    if (toolType === ToolType.PenAnnotation) {
      if (!annotationTool) return;
      // @ts-ignore
      annotationTool.brushSize = penSelectionBrushSize / stageScale;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [penSelectionBrushSize]);

  useEffect(() => {
    if (toolType === ToolType.QuickAnnotation) {
      if (!annotationTool) return;
      //@ts-ignore
      annotationTool.update(Math.round(quickSelectionBrushSize / stageScale));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [quickSelectionBrushSize]);

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

  const onMouseDown = (event: KonvaEventObject<MouseEvent>) => {
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
  ]);

  const onMouseMove = useMemo(() => {
    const func = () => {
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
    return () => throttled();
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
    const func = async () => {
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

    return () => throttled();
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
      !annotations.length ||
      !annotationTool ||
      annotationTool.annotationState === AnnotationStateType.Annotating
    )
      return;

    if (!activeImageId) return;

    dispatch(
      imageViewerSlice.actions.setImageInstances({
        instances: [...unselectedAnnotations, ...selectedAnnotations],
        imageId: activeImageId,
      })
    );

    if (soundEnabled) playCreateAnnotationSoundEffect();

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
      annotations,
      annotationTool,
      annotationTool?.annotationState,
      dispatch,
      selectedAnnotations,
      unselectedAnnotations,
      selectionMode,
      selectedAnnotationsIds,
    ]
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
        imageViewerSlice.actions.setActiveImage({ imageId: newActiveImageId })
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
        imageViewerSlice.actions.setActiveImage({ imageId: newActiveImageId })
      );
    },
    [images, activeImageId]
  );

  useHotkeys(
    "enter",
    () => {
      if (
        toolType !== ToolType.PolygonalAnnotation &&
        toolType !== ToolType.LassoAnnotation
      )
        return;

      if (!annotationTool) return;

      annotationTool.connect();
    },
    [toolType, annotationTool]
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

      if (!_.isEmpty(annotations) && soundEnabled) {
        playDeleteAnnotationSoundEffect();
      }

      deselectAnnotation();
    },
    [selectedAnnotationsIds, annotations]
  );

  useHotkeys(
    "escape",
    () => {
      deselectAllAnnotations();
      deselectAllTransformers();

      if (!_.isEmpty(annotations) && soundEnabled) {
        playDeleteAnnotationSoundEffect();
      }

      deselectAnnotation();

      if (toolType !== ToolType.Zoom) return;
      onZoomDeselect();
    },
    [annotations, annotationTool, toolType]
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

  useAnnotatorKeyboardShortcuts();

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
    <ReactKonva.Stage
      draggable={draggable}
      height={stageHeight}
      onMouseDown={(evt) => onMouseDown(evt)}
      onMouseMove={onMouseMove}
      onMouseUp={onMouseUp}
      onWheel={onZoomWheel}
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
  );
};
