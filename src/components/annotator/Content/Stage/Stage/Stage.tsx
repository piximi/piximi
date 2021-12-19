import * as ReactKonva from "react-konva";
import * as _ from "lodash";
import Konva from "konva";
import React, { useEffect, useMemo, useReducer, useRef, useState } from "react";
import { ToolType } from "../../../../../types/ToolType";
import {
  imageInstancesSelector,
  selectedCategorySelector,
  selectionModeSelector,
  stageHeightSelector,
  stageScaleSelector,
  stageWidthSelector,
  toolTypeSelector,
  zoomSelectionSelector,
} from "../../../../../store/selectors";
import {
  batch,
  Provider,
  ReactReduxContext,
  useDispatch,
  useSelector,
} from "react-redux";
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
import { annotatedSelector } from "../../../../../store/selectors/annotatedSelector";
import {
  ColorAnnotationTool,
  ObjectAnnotationTool,
  Tool,
} from "../../../../../annotator/image/Tool";
import { ColorAnnotationToolTip } from "../ColorAnnotationToolTip";
import useSound from "use-sound";
import createAnnotationSoundEffect from "../../../../../annotator/sounds/pop-up-on.mp3";
import deleteAnnotationSoundEffect from "../../../../../annotator/sounds/pop-up-off.mp3";
import { soundEnabledSelector } from "../../../../../store/selectors/soundEnabledSelector";
import { Layer } from "../Layer";
import { ZoomSelection } from "../Selection/ZoomSelection";
import { useKeyboardShortcuts } from "../../../../../hooks/useKeyboardShortcuts";
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
import { quickSelectionBrushSizeSelector } from "../../../../../store/selectors/quickSelectionBrushSizeSelector";
import { useHotkeys } from "react-hotkeys-hook";
import { PointerSelection } from "../Selection/PointerSelection";
import { usePointer } from "../../../../../hooks/usePointer/usePointer";
import { pointerSelectionSelector } from "../../../../../store/selectors/pointerSelectionSelector";
import { DndProvider } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";
import { cursorSelector } from "../../../../../store/selectors/cursorSelector";
import {
  imageViewerSlice,
  setSelectedAnnotations,
} from "../../../../../store/slices";
import { activeImageIdSelector } from "../../../../../store/selectors/activeImageIdSelector";

export const Stage = () => {
  const imageRef = useRef<Konva.Image | null>(null);
  const stageRef = useRef<Konva.Stage>(null);

  const selectingRef = useRef<Konva.Line | null>(null);

  const toolType = useSelector(toolTypeSelector);

  const penSelectionBrushSize = useSelector(penSelectionBrushSizeSelector);
  const selectedAnnotationsIds = useSelector(selectedAnnotationsIdsSelector);
  const quickSelectionBrushSize = useSelector(quickSelectionBrushSizeSelector);
  const selectedCategory = useSelector(selectedCategorySelector);

  const selectedAnnotations = useSelector(selectedAnnotationsSelector);
  const unselectedAnnotations = useSelector(unselectedAnnotationsSelector);
  const selectionMode = useSelector(selectionModeSelector);

  const stageHeight = useSelector(stageHeightSelector);
  const stageWidth = useSelector(stageWidthSelector);
  const stagePosition = useSelector(stagePositionSelector);

  const saveLabelRef = useRef<Konva.Label>();
  const clearLabelRef = useRef<Konva.Label>();

  const activeImageId = useSelector(activeImageIdSelector);

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

  const [, update] = useReducer((x) => x + 1, 0);

  const annotations = useSelector(imageInstancesSelector);

  const annotated = useSelector(annotatedSelector);

  const selectedAnnotation = useSelector(selectedAnnotationSelector);

  const { dragging: zoomDragging, selecting: zoomSelecting } = useSelector(
    zoomSelectionSelector
  );

  const { dragging: pointerDragging, selecting: pointerSelecting } =
    useSelector(pointerSelectionSelector);

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

  const deselectAllAnnotations = () => {
    dispatch(
      setSelectedAnnotations({
        selectedAnnotations: [],
        selectedAnnotation: undefined,
      })
    );
  };

  const deselectAnnotation = () => {
    if (!annotationTool) return;

    annotationTool.deselect();

    batch(() => {
      dispatch(imageViewerSlice.actions.setAnnotating({ annotating: false }));
      dispatch(
        imageViewerSlice.actions.setAnnotated({
          annotated: false,
          annotationTool,
        })
      );
    });

    if (!selectedAnnotation) return;

    selectingRef.current = null;

    const transformerId = "tr-".concat(selectedAnnotation.id);
    detachTransformer(transformerId);
  };

  const cursor = useSelector(cursorSelector);
  useCursor();

  useEffect(() => {
    if (!stageRef || !stageRef.current) return;
    stageRef.current.container().style.cursor = cursor;
  }, [cursor]);

  useEffect(() => {
    if (!annotationTool) return;

    if (annotationTool.annotated) {
      dispatch(
        imageViewerSlice.actions.setAnnotated({
          annotated: annotationTool.annotated,
          annotationTool,
        })
      );

      if (selectionMode !== AnnotationModeType.New) return;
      annotationTool.annotate(selectedCategory);
    }

    if (annotationTool.annotating)
      dispatch(
        imageViewerSlice.actions.setAnnotating({
          annotating: annotationTool.annotating,
        })
      );

    if (selectionMode === AnnotationModeType.New) return;
  }, [annotationTool?.annotated, annotationTool?.annotating]);

  useEffect(() => {
    if (toolType === ToolType.PenAnnotation) {
      if (!annotationTool) return;
      // @ts-ignore
      annotationTool.brushSize = penSelectionBrushSize / stageScale;
    }
  }, [penSelectionBrushSize]);

  useEffect(() => {
    if (toolType === ToolType.QuickAnnotation) {
      if (!annotationTool) return;
      //@ts-ignore
      annotationTool.update(Math.round(quickSelectionBrushSize / stageScale));
    }
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

      if (
        saveLabelRef &&
        saveLabelRef.current &&
        saveLabelRef.current.getText() &&
        clearLabelRef.current
      ) {
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
        if (annotated) {
          deselectAnnotation();
          dispatch(
            imageViewerSlice.actions.setAnnotated({
              annotated: false,
              annotationTool,
            })
          );
        }

        if (selectionMode === AnnotationModeType.New) {
          dispatch(
            imageViewerSlice.actions.setSelectedAnnotations({
              selectedAnnotations: [],
              selectedAnnotation: undefined,
            })
          );
        }

        if (!annotationTool) return;

        annotationTool.onMouseDown(rawImagePosition);

        update();
      }
    };
    const throttled = _.throttle(func, 5);
    return () => throttled();
  }, [
    annotated,
    annotationTool,
    saveLabelRef,
    pointerDragging,
    pointerSelecting,
    selectionMode,
    toolType,
    zoomDragging,
    zoomSelecting,
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

        update();
      }
    };
    const throttled = _.throttle(func, 5);
    return () => throttled();
  }, [
    annotationTool,
    pointerDragging,
    pointerSelecting,
    toolType,
    zoomDragging,
    zoomSelecting,
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

        update();
      }
    };
    const throttled = _.throttle(func, 10);

    return () => throttled();
  }, [
    annotationTool,
    pointerDragging,
    pointerSelecting,
    toolType,
    zoomDragging,
    zoomSelecting,
  ]);

  const confirmAnnotations = () => {
    if (!annotations || !annotationTool || annotationTool.annotating) return;

    if (!activeImageId) return;

    dispatch(
      imageViewerSlice.actions.setImageInstances({
        instances: [...unselectedAnnotations, ...selectedAnnotations],
        imageId: activeImageId,
      })
    );

    if (soundEnabled) playCreateAnnotationSoundEffect();

    deselectAnnotation();

    dispatch(
      imageViewerSlice.actions.setAnnotated({
        annotated: false,
        annotationTool,
      })
    );

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
      annotationTool?.annotating,
      dispatch,
      selectedAnnotations,
      unselectedAnnotations,
      selectionMode,
      selectedAnnotationsIds,
    ]
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
    if (!annotations) return;

    if (annotations.length) return;

    deselectAllTransformers();
    deselectAllAnnotations();
  }, [annotations?.length]);

  const [tool, setTool] = useState<Tool>();

  useEffect(() => {
    setTool(annotationTool);
  }, [annotationTool, toolType]);

  useKeyboardShortcuts();

  const { draggable } = useHandTool();

  /* re. use of Consumer -> Stage -> Provider
    https://github.com/konvajs/react-konva/issues/311
   */
  return (
    <>
      <ReactReduxContext.Consumer>
        {({ store }) => (
          <>
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
                      annotationTool={annotationTool}
                    />

                    <PointerSelection />

                    <Annotations />

                    <Transformers
                      transformPosition={getRelativePointerPosition}
                    />

                    <ColorAnnotationToolTip
                      toolTipPosition={
                        (annotationTool as ColorAnnotationTool)?.toolTipPosition
                      }
                      initialPosition={
                        (annotationTool as ColorAnnotationTool)?.initialPosition
                      }
                      tolerance={
                        (annotationTool as ColorAnnotationTool)?.tolerance
                      }
                    />
                  </Layer>
                </DndProvider>
              </Provider>
            </ReactKonva.Stage>
          </>
        )}
      </ReactReduxContext.Consumer>
    </>
  );
};
