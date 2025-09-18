import { useCallback, useState } from "react";
import { batch, useDispatch, useSelector } from "react-redux";

import { useHotkeys } from "hooks/useHotkeys";

import { annotatorSlice } from "views/ImageViewer/state/annotator";

import { getOverlappingAnnotations } from "views/ImageViewer/utils";
import { getAnnotationsInBox } from "views/ImageViewer/utils/imageHelper";

import { ToolType } from "views/ImageViewer/utils/enums";
import { HotkeyContext } from "utils/enums";

import { Point } from "utils/types";
import {
  selectActiveMetadataId,
  selectTimeLinkingState,
  selectActiveTrackId,
} from "../state/image-viewer-data/selectors";
import {
  selectActiveAnnotations,
  selectActiveTimeLinkedAnnId,
} from "../state/image-viewer-data/reselectors";
import { imageViewerDataSlice } from "../state/image-viewer-data/ImageViewerDataSlice";
import { ProtoAnnotationObject } from "../state/types";
import { DecodedAnnotationObject } from "store/data/types";
import { dataSlice } from "store/data";

const delta = 10;

export const usePointerTool = (
  absolutePosition: any,
  deselectAllAnnotations: any,
  selectedAnnotationsIds: any,
  toolType: any,
) => {
  const dispatch = useDispatch();
  const activeMetadataId = useSelector(selectActiveMetadataId);
  const activeAnnotations = useSelector(selectActiveAnnotations);
  const tLinkingActive = useSelector(selectTimeLinkingState);
  const activeTrackId = useSelector(selectActiveTrackId);
  const activeTimeLinkedAnnId = useSelector(selectActiveTimeLinkedAnnId);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [shift, setShift] = useState<boolean>(false);
  const [dragging, setDragging] = useState<boolean>(false);
  const [minimum, setMinimum] = useState<Point | undefined>();
  const [maximum, setMaximum] = useState<Point | undefined>();
  const [selecting, setSelecting] = useState<boolean>(false);

  useHotkeys(
    "shift",
    (event) => {
      if (event.type === "keydown") {
        setShift(true);
      } else {
        setShift(false);
      }
    },
    HotkeyContext.AnnotatorView,
    { keyup: true, keydown: true },
    [],
  );

  const selectEnclosedAnnotations = useCallback(
    (position: { x: number; y: number }) => {
      if (!position || !selecting || !minimum) return;
      // correct minimum or maximum in the case where user may have selected rectangle from right to left

      const minimumNew: { x: number; y: number } = {
        x: minimum.x > position.x ? position.x : minimum.x,
        y: minimum.y > position.y ? position.y : minimum.y,
      };
      const maximumNew: { x: number; y: number } = {
        x: minimum.x > position.x ? minimum.x : position.x,
        y: minimum.y > position.y ? minimum.y : position.y,
      };

      if (!minimumNew || !activeAnnotations.length) {
        setSelecting(false);
        return;
      }

      const annotationsInBox = getAnnotationsInBox(
        minimumNew,
        maximumNew,
        activeAnnotations,
      );

      if (annotationsInBox.length) {
        let newSelectedAnnotations: string[] = annotationsInBox.map(
          (an) => an.id,
        );
        if (shift) {
          newSelectedAnnotations = [
            ...selectedAnnotationsIds,
            ...newSelectedAnnotations,
          ];
        } else {
          //only include if not already selected
          const additionalAnnotations = newSelectedAnnotations.filter(
            (id: string) => {
              return !selectedAnnotationsIds.includes(id);
            },
          );
          newSelectedAnnotations = [
            ...selectedAnnotationsIds,
            ...additionalAnnotations,
          ];
        }
        batch(() => {
          dispatch(
            imageViewerDataSlice.actions.setSelectedAnnotationIds(
              newSelectedAnnotations,
            ),
          );
          dispatch(
            annotatorSlice.actions.setWorkingAnnotation({
              annotation: activeAnnotations.filter(
                (annotation) => annotation.id === newSelectedAnnotations[0],
              )[0] as ProtoAnnotationObject,
            }),
          );
        });
      }

      setSelecting(false);
    },
    [
      activeAnnotations,
      dispatch,
      minimum,
      selectedAnnotationsIds,
      selecting,
      shift,
    ],
  );
  /*
   * * HANDLE POINTER FUNCTIONS * *
   */

  const onPointerMouseDown = useCallback(
    (position: { x: number; y: number }) => {
      if (tLinkingActive) return;
      setDragging(false);
      setMinimum(position);
      setSelecting(true);
    },
    [],
  );

  const handlePointerMouseMove = useCallback(
    (position: { x: number; y: number }) => {
      if (!position || !selecting || !minimum) return;

      setDragging(Math.abs(position.x - minimum.x) >= delta);
      setMaximum(position);
    },
    [minimum, selecting],
  );

  const handleClick = useCallback(() => {
    if (
      toolType !== ToolType.Pointer ||
      !absolutePosition ||
      !activeAnnotations.length ||
      !activeMetadataId
    )
      return;
    let currentAnnotation: ProtoAnnotationObject | undefined;

    const overlappingAnnotationIds = getOverlappingAnnotations(
      absolutePosition,
      activeAnnotations,
    );

    if (overlappingAnnotationIds.length === 0) {
      deselectAllAnnotations();
      dispatch(
        annotatorSlice.actions.setWorkingAnnotation({
          annotation: undefined,
        }),
      );
    } else if (overlappingAnnotationIds.length > 1) {
      setCurrentIndex((currentIndex) => {
        return currentIndex + 1 === overlappingAnnotationIds.length
          ? 0
          : currentIndex + 1;
      });

      const nextAnnotationId = overlappingAnnotationIds[currentIndex];

      currentAnnotation = activeAnnotations.find(
        (annotation: DecodedAnnotationObject) => {
          return annotation.id === nextAnnotationId;
        },
      ) as ProtoAnnotationObject;
    } else {
      currentAnnotation = activeAnnotations.find(
        (annotation: DecodedAnnotationObject) => {
          return annotation.id === overlappingAnnotationIds[0];
        },
      ) as ProtoAnnotationObject;
      setCurrentIndex(0);
    }

    if (!currentAnnotation) return;
    if (tLinkingActive) {
      let annTrackId = currentAnnotation.trackId;
      // If the current annotation belongs to a track, check to see if it is the active track
      // if not, do nothing
      if (annTrackId && annTrackId !== activeTrackId) return;

      // Assign a track ID to annotation if one doesnt exist
      if (!annTrackId) {
        annTrackId = activeTrackId!; // Can assert Truthy since tLinkingActive is true
        dispatch(
          dataSlice.actions.updateAnnotation({
            id: currentAnnotation.id,
            changes: { trackId: annTrackId },
          }),
        );
        dispatch(
          dataSlice.actions.addAnnotationToTrackletRecord({
            trackId: annTrackId,
            annId: currentAnnotation.id,
          }),
        );
        if (activeTimeLinkedAnnId) {
          dispatch(
            dataSlice.actions.removeAnnotationFromTrackletRecord({
              trackId: annTrackId,
              annId: activeTimeLinkedAnnId,
            }),
          );
        }
      } else {
        if (activeTimeLinkedAnnId) {
          dispatch(
            dataSlice.actions.removeAnnotationFromTrackletRecord({
              trackId: annTrackId,
              annId: activeTimeLinkedAnnId,
            }),
          );
        }
        if (activeTimeLinkedAnnId !== currentAnnotation.id) {
          dispatch(
            dataSlice.actions.addAnnotationToTrackletRecord({
              trackId: annTrackId,
              annId: currentAnnotation.id,
            }),
          );
        }
      }
      dispatch(
        imageViewerDataSlice.actions.toggleTLinkedAnnotation(
          currentAnnotation.id,
        ),
      );
    } else {
      if (!shift) {
        batch(() => {
          dispatch(
            imageViewerDataSlice.actions.setSelectedAnnotationIds(
              currentAnnotation.id,
            ),
          );
          dispatch(
            annotatorSlice.actions.setWorkingAnnotation({
              annotation: currentAnnotation,
            }),
          );
          dispatch(
            imageViewerDataSlice.actions.setSelectedCategoryId(
              currentAnnotation.categoryId,
            ),
          );
        });
      }

      if (shift && !selectedAnnotationsIds.includes(currentAnnotation.id)) {
        //include newly selected annotation if not already selected
        dispatch(
          imageViewerDataSlice.actions.setSelectedAnnotationIds([
            ...selectedAnnotationsIds,
            currentAnnotation.id,
          ]),
        );
        dispatch(
          annotatorSlice.actions.setWorkingAnnotation({
            annotation: currentAnnotation,
          }),
        );
      }
    }
  }, [
    activeAnnotations,
    currentIndex,
    dispatch,
    activeMetadataId,
    selectedAnnotationsIds,
    shift,
    toolType,
    deselectAllAnnotations,
    absolutePosition,
    activeTrackId,
    activeTimeLinkedAnnId,
  ]);

  const handlePointerMouseUp = useCallback(
    (position: { x: number; y: number }) => {
      if (!position || !selecting || !minimum) return;
      if (dragging) {
        // correct minimum or maximum in the case where user may have selected rectangle from right to left
        selectEnclosedAnnotations(position);
      } else {
        handleClick();
      }
      setDragging(false);
      setSelecting(false);
    },
    [dragging, minimum, selecting, selectEnclosedAnnotations, handleClick],
  );

  return {
    onPointerMouseDown,
    handlePointerMouseMove,
    handlePointerMouseUp,
    dragging,
    minimum,
    maximum,
    selecting,
  };
};
