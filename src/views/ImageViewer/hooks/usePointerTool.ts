import { useCallback, useMemo, useState } from "react";

import { useDispatch, useSelector } from "react-redux";

import { annotatorSlice } from "views/ImageViewer/state/annotator";
import {
  getOverlappingAnnotations,
  getAnnotationsInBox,
} from "views/ImageViewer/utils";
import { ToolType } from "views/ImageViewer/utils/enums";
import {
  selectAllActiveAnnotations,
  selectSelectedAnnotations,
} from "@ImageViewer/state/image-viewer-data/reselectors";
import type { ExtendedAnnotationObject } from "store/data/types";
import { imageViewerDataSlice } from "@ImageViewer/state/image-viewer-data/imageViewerDataSlice";
import { selectActiveImageId } from "@ImageViewer/state/image-viewer-data/selectors";
import {
  selectIsPickingTarget,
  selectOverlapCandidateIds,
} from "@ImageViewer/state/operations/reselectors";

import type { Point } from "utils/types";

const delta = 10;

const annotationsInDragBox = ({
  position,
  activeAnnotations,
  minimum,
}: {
  position: Point;
  activeAnnotations: ExtendedAnnotationObject[];
  minimum: Point;
}): string[] => {
  // correct minimum or maximum in the case where user may have selected rectangle from right to left
  const minimumNew: { x: number; y: number } = {
    x: minimum.x > position.x ? position.x : minimum.x,
    y: minimum.y > position.y ? position.y : minimum.y,
  };
  const maximumNew: { x: number; y: number } = {
    x: minimum.x > position.x ? minimum.x : position.x,
    y: minimum.y > position.y ? minimum.y : position.y,
  };

  const annotationsInBox = getAnnotationsInBox(
    minimumNew,
    maximumNew,
    activeAnnotations,
  );
  if (!annotationsInBox) return [];

  return annotationsInBox.map((an) => an.id);
};

/**
 * Click and box-drag selection. Both gestures write to the selection layer's
 * manual override sets, which sit on top of the category/feature criterion:
 *
 *   - A click toggles one annotation. Clicking a criterion-selected annotation
 *     off records an exclusion; clicking an unmatched one on records a sticky
 *     include.
 *   - A box drag includes everything it encloses (a box is an explicit "these",
 *     never a deselection).
 *
 * `on` is decided here rather than in the reducer because whether an annotation
 * is currently selected depends on the live criterion.
 */
export const usePointerTool = (
  absolutePosition: Point | undefined,
  deselectAllAnnotations: () => void,
  toolType: ToolType,
) => {
  const dispatch = useDispatch();
  const activeImageId = useSelector(selectActiveImageId);
  const activeAnnotations = useSelector(selectAllActiveAnnotations);
  const selectedAnnotations = useSelector(selectSelectedAnnotations);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [dragging, setDragging] = useState<boolean>(false);
  const [minimum, setMinimum] = useState<Point | undefined>();
  const [maximum, setMaximum] = useState<Point | undefined>();
  const [selecting, setSelecting] = useState<boolean>(false);

  const selectedIds = useMemo(
    () => new Set(selectedAnnotations.map((a) => a.id)),
    [selectedAnnotations],
  );

  const isPickingTarget = useSelector(selectIsPickingTarget);
  const candidateIds = useSelector(selectOverlapCandidateIds);

  // No shift tracking: clicks toggle, so there is no add-to-existing modifier to
  // distinguish from a replacing click.

  const selectEnclosedAnnotations = useCallback(
    (position: { x: number; y: number }) => {
      if (!position || !selecting || !minimum || activeAnnotations.length === 0)
        return;
      const enclosed = annotationsInDragBox({
        position,
        activeAnnotations,
        minimum,
      });
      if (enclosed.length > 0)
        dispatch(
          imageViewerDataSlice.actions.toggleAnnotationSelection({
            ids: enclosed,
            on: true,
          }),
        );

      setSelecting(false);
    },
    [activeAnnotations, dispatch, minimum, selecting],
  );

  /**
   * Resolve an ambiguous stroke operation's target from a click, cycling through
   * the candidates under the cursor on repeat clicks in the same spot. Called
   * ahead of the annotation tool's own handling, since while a pick is
   * outstanding that is the only thing a click can usefully mean.
   */
  const pickTargetAt = useCallback(
    (position: Point) => {
      const under = getOverlappingAnnotations(
        position,
        activeAnnotations,
      ).filter((id) => candidateIds.includes(id));
      if (under.length === 0) return;
      dispatch(
        annotatorSlice.actions.togglePendingTargetIds(
          under[currentIndex % under.length],
        ),
      );
      setCurrentIndex((i) => (i + 1) % under.length);
    },
    [activeAnnotations, candidateIds, currentIndex, dispatch],
  );

  const handleClick = useCallback(() => {
    if (
      toolType !== ToolType.Pointer ||
      !absolutePosition ||
      !activeAnnotations.length ||
      !activeImageId
    )
      return;
    let currentAnnotation: ExtendedAnnotationObject | undefined;

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

      currentAnnotation = activeAnnotations.find((annotation) => {
        return annotation.id === nextAnnotationId;
      });
    } else {
      currentAnnotation = activeAnnotations.find((annotation) => {
        return annotation.id === overlappingAnnotationIds[0];
      });
      setCurrentIndex(0);
    }

    if (!currentAnnotation) return;

    // A click always toggles just this annotation — there is no replace gesture,
    // so a stray click can never discard a built-up category/feature criterion.
    dispatch(
      imageViewerDataSlice.actions.toggleAnnotationSelection({
        ids: [currentAnnotation.id],
        on: !selectedIds.has(currentAnnotation.id),
      }),
    );
  }, [
    activeAnnotations,
    currentIndex,
    dispatch,
    activeImageId,
    selectedIds,
    toolType,
    deselectAllAnnotations,
    absolutePosition,
  ]);

  /*
   * * HANDLE POINTER FUNCTIONS * *
   */

  const onPointerMouseDown = useCallback(
    (position: { x: number; y: number }) => {
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
    isPickingTarget,
    pickTargetAt,
    dragging,
    minimum,
    maximum,
    selecting,
  };
};
