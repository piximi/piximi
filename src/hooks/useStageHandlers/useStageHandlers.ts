import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { batch, useDispatch, useSelector } from "react-redux";
import { KonvaEventObject } from "konva/lib/Node";
import Konva from "konva";
import { throttle } from "lodash";

import { useHotkeys, useZoom, useAnnotatorKeyboardShortcuts } from "hooks";

import {
  imageViewerSlice,
  currentIndexSelector,
  setSelectedAnnotationIds,
  setSelectedCategoryId,
  selectSelectedAnnotationIds,
} from "store/imageViewer";

import {
  selectAnnotationSelectionMode,
  selectToolType,
} from "store/annotator/selectors";

import {
  selectActiveImageHeight,
  selectActiveImageWidth,
  selectActiveAnnotations,
  selectWorkingAnnotation,
} from "store/data";
import { annotatorSlice } from "store/annotator";

import {
  DecodedAnnotationType,
  HotkeyView,
  Point,
  ToolType,
  AnnotationStateType,
  AnnotationModeType,
} from "types";

import {
  getAnnotationsInBox,
  getOverlappingAnnotations,
} from "utils/annotator";
import { AnnotationTool, ObjectAnnotationTool } from "annotator-tools";

const delta = 10;

export const useStageHandlers = (
  stageRef: React.RefObject<Konva.Stage> | null,
  annotationTool: AnnotationTool,
  positionByStage: Point | undefined,
  absolutePosition: Point | undefined,
  draggable: boolean,
  annotationState: AnnotationStateType,
  outOfBounds: boolean,
  setCurrentMousePosition: () => void
) => {
  const [overlappingAnnotationsIds, setOverlappingAnnotationIds] = useState<
    Array<string>
  >([]);
  const [firstMouseDown, setFirstMouseDown] = useState(false);
  const [dragging, setDragging] = useState<boolean>(false);
  const [minimum, setMinimum] = useState<Point | undefined>();
  const [maximum, setMaximum] = useState<Point | undefined>();
  const [selecting, setSelecting] = useState<boolean>(false);
  const [shift, setShift] = useState<boolean>(false);
  const selectionMode = useSelector(selectAnnotationSelectionMode);
  const workingAnnotation = useSelector(selectWorkingAnnotation);
  const dispatch = useDispatch();
  const toolType = useSelector(selectToolType);
  const selectedAnnotationsIds = useSelector(selectSelectedAnnotationIds);
  const activeAnnotations = useSelector(selectActiveAnnotations);
  const imageWidth = useSelector(selectActiveImageWidth);
  const imageHeight = useSelector(selectActiveImageHeight);
  const currentIndex = useSelector(currentIndexSelector);
  const saveLabelRef = useRef<Konva.Label>();
  const clearLabelRef = useRef<Konva.Label>();
  const labelGroupRef = useRef<Konva.Group>();

  const {
    handleZoomDblClick,
    handleZoomMouseDown,
    handleZoomMouseMove,
    handleZoomMouseUp,
    handleZoomScroll,
    resetZoomSelection,
  } = useZoom(stageRef?.current);

  const detachTransformer = useCallback(
    (transformerId: string) => {
      if (!stageRef || !stageRef.current) return;
      const transformer = stageRef.current.findOne(`#${transformerId}`);
      if (!transformer) return;
      (transformer as Konva.Transformer).detach();
      (transformer as Konva.Transformer).getLayer()?.batchDraw();
    },
    [stageRef]
  );
  const detachAllTransformers = useCallback(() => {
    if (!stageRef || !stageRef.current) return;
    // const transformers = stageRef.current.find("Transformer").toArray();
    const transformers = stageRef.current.find("Transformer");
    transformers.forEach((tr: any) => {
      (tr as Konva.Transformer).detach();
      (tr as Konva.Transformer).getLayer()?.batchDraw();
    });
  }, [stageRef]);

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
  }, [annotationTool, workingAnnotation, dispatch, detachTransformer]);

  const deleteAnnotations = (
    annotationIds: Array<string>,
    stagedAnnotations: Array<DecodedAnnotationType>
  ) => {};
  const deselectAllAnnotations = useCallback(() => {
    dispatch(
      setSelectedAnnotationIds({
        annotationIds: [],
        workingAnnotationId: undefined,
      })
    );
    detachAllTransformers();
  }, [dispatch, detachAllTransformers]);

  useHotkeys(
    "shift",
    (event) => {
      if (event.type === "keydown") {
        setShift(true);
      } else {
        setShift(false);
      }
    },
    HotkeyView.Annotator,
    { keyup: true, keydown: true }
  );
  const onPointerMouseDown = useCallback(
    (position: { x: number; y: number }) => {
      setDragging(false);
      setMinimum(position);
      setSelecting(true);
    },
    []
  );
  const handlePointerMouseMove = useCallback(
    (position: { x: number; y: number }) => {
      if (!position || !selecting || !minimum) return;

      setDragging(Math.abs(position.x - minimum.x) >= delta);
      setMaximum(position);
    },
    [minimum, selecting]
  );

  const handleMouseDown = (
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
    stageRef,
  ]);
  const handleMouseMove = useMemo(() => {
    const func = (event: KonvaEventObject<MouseEvent>) => {
      if (!stageRef || !stageRef.current || draggable) return;
      setCurrentMousePosition();
      if (!positionByStage) return;
      if (toolType === ToolType.ColorAdjustment) return;
      if (toolType === ToolType.Zoom) {
        handleZoomMouseMove(positionByStage, event);
      } else if (toolType === ToolType.Pointer) {
        handlePointerMouseMove(absolutePosition!);
      } else {
        if (!annotationTool) return;
        annotationTool.onMouseMove(absolutePosition!);
      }
    };
    const throttled = throttle(func, 5);
    return (event: KonvaEventObject<MouseEvent>) => throttled(event);
  }, [
    stageRef,
    handlePointerMouseMove,
    handleZoomMouseMove,
    setCurrentMousePosition,
    positionByStage,
    draggable,
    annotationTool,
    toolType,
    absolutePosition,
  ]);

  const handleTouchMove = useMemo(() => {
    const func = (event: KonvaEventObject<TouchEvent>) => {
      if (!stageRef || !stageRef.current || draggable) return;
      setCurrentMousePosition();
      if (!absolutePosition) return;
      handlePointerMouseMove(absolutePosition);
    };
    const throttled = throttle(func, 5);
    return (event: KonvaEventObject<TouchEvent>) => throttled(event);
  }, [
    stageRef,
    handlePointerMouseMove,
    setCurrentMousePosition,
    absolutePosition,
    draggable,
  ]);

  const onClick = useCallback(
    (position: { x: number; y: number }) => {
      if (toolType !== ToolType.Pointer) return;

      if (!position) return;

      if (!activeAnnotations.length || !imageWidth || !imageHeight) return;

      const scaledCurrentPosition = {
        x: position.x,
        y: position.y,
      };

      setOverlappingAnnotationIds(
        getOverlappingAnnotations(
          scaledCurrentPosition,
          activeAnnotations,
          imageWidth,
          imageHeight
        )
      );

      let currentAnnotation: DecodedAnnotationType | undefined;

      if (overlappingAnnotationsIds.length > 1) {
        dispatch(
          imageViewerSlice.actions.setCurrentIndex({
            currentIndex:
              currentIndex + 1 === overlappingAnnotationsIds.length
                ? 0
                : currentIndex + 1,
          })
        );
        const nextAnnotationId = overlappingAnnotationsIds[currentIndex];

        currentAnnotation = activeAnnotations.find(
          (annotation: DecodedAnnotationType) => {
            return annotation.id === nextAnnotationId;
          }
        );
      } else {
        currentAnnotation = activeAnnotations.find(
          (annotation: DecodedAnnotationType) => {
            return annotation.id === overlappingAnnotationsIds[0];
          }
        );
        dispatch(
          imageViewerSlice.actions.setCurrentIndex({
            currentIndex: 0,
          })
        );
      }

      if (!currentAnnotation) return;

      if (!shift) {
        batch(() => {
          dispatch(
            setSelectedAnnotationIds({
              annotationIds: [currentAnnotation!.id],
              workingAnnotationId: currentAnnotation?.id,
            })
          );
          dispatch(
            setSelectedCategoryId({
              selectedCategoryId: currentAnnotation!.categoryId,
              execSaga: false,
            })
          );
        });
      }

      if (shift && !selectedAnnotationsIds.includes(currentAnnotation.id)) {
        //include newly selected annotation if not already selected
        dispatch(
          setSelectedAnnotationIds({
            annotationIds: [...selectedAnnotationsIds, currentAnnotation.id],
            workingAnnotationId: currentAnnotation.id,
          })
        );
      }
    },
    [
      activeAnnotations,
      currentIndex,
      dispatch,
      imageHeight,
      imageWidth,
      overlappingAnnotationsIds,
      selectedAnnotationsIds,
      shift,
      toolType,
    ]
  );

  const handlePointerMouseUp = useCallback(
    (position: { x: number; y: number }) => {
      if (!position || !selecting || !minimum) return;
      if (dragging) {
        // correct minimum or maximum in the case where user may have selected rectangle from right to left
        const maximumNew: { x: number; y: number } = {
          x: minimum.x > position.x ? minimum.x : position.x,
          y: minimum.y > position.y ? minimum.y : position.y,
        };
        const minimumNew: { x: number; y: number } = {
          x: minimum.x > position.x ? position.x : minimum.x,
          y: minimum.y > position.y ? position.y : minimum.y,
        };

        if (!minimumNew || !activeAnnotations.length) {
          setSelecting(false);
          return;
        }

        const scaledMinimum = {
          x: minimumNew.x,
          y: minimumNew.y,
        };
        const scaledMaximum = {
          x: maximumNew.x,
          y: maximumNew.y,
        };

        const annotationsInBox = getAnnotationsInBox(
          scaledMinimum,
          scaledMaximum,
          activeAnnotations
        );

        if (annotationsInBox.length) {
          if (!shift) {
            batch(() => {
              dispatch(
                setSelectedAnnotationIds({
                  annotationIds: annotationsInBox.map((an) => an.id),
                  workingAnnotationId: annotationsInBox[0].id,
                })
              );
              dispatch(
                setSelectedCategoryId({
                  selectedCategoryId: annotationsInBox[0].categoryId,
                  execSaga: false,
                })
              );
            });
          } else {
            //only include if not already selected
            const additionalAnnotations = annotationsInBox.filter(
              (annotation: DecodedAnnotationType) => {
                return !selectedAnnotationsIds.includes(annotation.id);
              }
            );
            dispatch(
              setSelectedAnnotationIds({
                annotationIds: [
                  ...selectedAnnotationsIds,
                  ...additionalAnnotations.map((an) => an.id),
                ],
                workingAnnotationId: annotationsInBox[0].id,
              })
            );
          }
        }
      } else {
        onClick(position);
      }

      setSelecting(false);
    },
    [
      activeAnnotations,
      dispatch,
      dragging,
      minimum,
      onClick,
      selectedAnnotationsIds,
      selecting,
      shift,
    ]
  );

  const handleMouseUp = useMemo(() => {
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
        handlePointerMouseUp(absolutePosition);
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
    handlePointerMouseUp,
    handleZoomMouseUp,
    absolutePosition,
    positionByStage,
    setCurrentMousePosition,
    draggable,
    annotationTool,
    toolType,
  ]);

  const handleZoomWheel = (event: KonvaEventObject<WheelEvent>) => {
    handleZoomScroll(event);
    setCurrentMousePosition();
  };
  const handleDblClickToZoom = (event: KonvaEventObject<MouseEvent>) => {
    handleZoomDblClick(event);
    setCurrentMousePosition();
  };
  useAnnotatorKeyboardShortcuts({
    annotationTool,
    deleteAnnotations,
    deselectAllAnnotations,
    deselectAnnotation,
    resetZoomSelection,
    workingAnnotation,
    selectedAnnotationsIds,
    selectionMode,
    toolType,
  });

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
  }, [stageRef, selectedAnnotationsIds, workingAnnotation?.maskData]);

  return {
    onPointerMouseDown,

    handleMouseUp,
    handleMouseMove,
    handleTouchMove,
    onPointerClick: onClick,
    handleZoomWheel,
    handleDblClickToZoom,
    dragging,
    selecting,
    minimum,
    maximum,
    handleMouseDown,
  };
};
