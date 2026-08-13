import { useCallback } from "react";

import { batch, useDispatch, useSelector } from "react-redux";

import { useSound } from "use-sound";

import { annotatorSlice } from "@ImageViewer/state/annotator";
import { dataSliceV2 } from "store/data";
import { encode } from "@ImageViewer/utils";
import type { AnnotationObject, AnnotationVolume } from "store/data/types";
import { generateUUID } from "store/data/utils";
import { selectSoundEnabled } from "store/applicationSettings/selectors";
import { selectWorkingAnnotationEntity } from "@ImageViewer/state/annotator/selectors";
import {
  selectOverlapCandidateIds,
  selectPendingOperation,
  selectSelectionOperandIds,
  selectSelectionOverlaps,
} from "@ImageViewer/state/operations/reselectors";
import { selectActiveViewerImage } from "@ImageViewer/state/image-viewer-data/reselectors";
import { selectSelectedCategory } from "@ImageViewer/state/image-viewer-data/selectors";
import { imageViewerDataSlice } from "@ImageViewer/state/image-viewer-data/imageViewerDataSlice";

import { computeObjectFeatures } from "utils/measurements/computeObjectFeatures";
import { Partition } from "utils/dl/enums";
import { computeObjectIntensityMeasurements } from "utils/measurements/computeObjectIntensityMeasurements";

import createAnnotationSoundEffect from "data/sounds/pop-up-on.mp3";
import deleteAnnotationSoundEffect from "data/sounds/pop-up-off.mp3";

import type { AnnotationTool } from "@ImageViewer/utils/tools";

export const useAnnotationConfirmation = (annotationTool: AnnotationTool) => {
  const dispatch = useDispatch();
  const activeImage = useSelector(selectActiveViewerImage);
  const selectedCategory = useSelector(selectSelectedCategory);
  const workingAnnotation = useSelector(selectWorkingAnnotationEntity);
  const pendingOperation = useSelector(selectPendingOperation);
  const workingAnnotationEntity = useSelector(selectWorkingAnnotationEntity);
  const overlapCandidates = useSelector(selectOverlapCandidateIds);
  const selectionOperands = useSelector(selectSelectionOperandIds);
  const selectionOverlaps = useSelector(selectSelectionOverlaps);
  const soundEnabled = useSelector(selectSoundEnabled);
  const [playCreate] = useSound(createAnnotationSoundEffect);
  const [playDelete] = useSound(deleteAnnotationSoundEffect);
  const clearAnnotation = useCallback(() => {
    annotationTool.deselect();
    batch(() => {
      dispatch(
        annotatorSlice.actions.setWorkingAnnotation({ annotation: undefined }),
      );
      dispatch(annotatorSlice.actions.clearPendingOperation());
    });
  }, [annotationTool, dispatch]);

  /**
   * Rewrite each changed annotation's geometry in place and delete the operands
   * folded into it. Identity is deliberately untouched: keeping `volumeId`
   * preserves category, kind and prediction metadata, which live on the volume.
   * Features are recomputed because they are mask-derived and would otherwise
   * go stale and corrupt feature-range filtering.
   */
  const applyOperation = useCallback(async () => {
    if (!pendingOperation || pendingOperation.empty) return;
    const entries = Object.entries(pendingOperation.updates);
    if (entries.length === 0) return;

    batch(async () => {
      for (const [id, region] of entries) {
        const features = computeObjectFeatures([
          {
            id,
            boundingBox: region.bbox,
            decodedMask: region.mask,
            encodedMask: [],
            features: undefined,
          },
        ]);
        const channelMeasurements = await computeObjectIntensityMeasurements([
          {
            channelRefs: activeImage!.channelsRef,
            objs: [
              {
                id,
                boundingBox: region.bbox,
                decodedMask: region.mask,
                encodedMask: [],
              },
            ],
          },
        ]);
        dispatch(
          dataSliceV2.actions.updateAnnotationMask({
            id,
            boundingBox: region.bbox,
            encodedMask: encode(region.mask),
            features: features[id],
            intensityMeasurements: channelMeasurements,
          }),
        );
      }
      if (pendingOperation.absorbedIds.length) {
        dispatch(
          dataSliceV2.actions.batchDeleteAnnotation(
            pendingOperation.absorbedIds,
          ),
        );
        // The absorbed ids are gone from the store; drop them from the manual
        // selection sets so they do not linger there.
        dispatch(
          imageViewerDataSlice.actions.forgetAnnotationIds(
            pendingOperation.absorbedIds,
          ),
        );
      }
    });
    if (soundEnabled) playCreate();

    clearAnnotation();
  }, [pendingOperation, dispatch, clearAnnotation, soundEnabled, playCreate]);

  const confirmAnnotation = useCallback(async () => {
    if (!activeImage || !workingAnnotation.saved || !selectedCategory) return;
    const wAnn = workingAnnotation.saved;
    const volume: AnnotationVolume = {
      id: generateUUID(),
      imageId: wAnn.imageId,
      kindId: selectedCategory.kindId,
      categoryId: selectedCategory.id,
    };
    const bboxW = wAnn.boundingBox[2] - wAnn.boundingBox[0];
    const bboxH = wAnn.boundingBox[3] - wAnn.boundingBox[1];
    const annotation: AnnotationObject = {
      id: generateUUID(),
      imageId: wAnn.imageId,
      planeId: wAnn.planeId,
      volumeId: volume.id,
      partition: Partition.Unassigned,
      shape: { planes: 1, width: bboxW, height: bboxH, channels: 1 },
      boundingBox: wAnn.boundingBox,
      encodedMask: encode(wAnn.decodedMask),
    };
    const features = computeObjectFeatures([
      { ...annotation, decodedMask: wAnn.decodedMask },
    ]);
    const channelMeasurements = await computeObjectIntensityMeasurements([
      {
        channelRefs: activeImage!.channelsRef,
        objs: [
          {
            ...annotation,
            decodedMask: wAnn.decodedMask,
          },
        ],
      },
    ]);
    annotation.features = features[annotation.id];
    annotation.intensityMeasurements = channelMeasurements[annotation.id];
    batch(() => {
      dispatch(dataSliceV2.actions.addAnnotationVolume(volume));
      dispatch(dataSliceV2.actions.addAnnotation(annotation));
    });
    if (soundEnabled) playCreate();

    clearAnnotation();
  }, [
    activeImage,
    workingAnnotation,
    selectedCategory,
    soundEnabled,
    dispatch,
    clearAnnotation,
    playCreate,
  ]);

  const cancel = useCallback(() => {
    clearAnnotation();
    if (soundEnabled) playDelete();
  }, [clearAnnotation, soundEnabled, playDelete]);

  const staged = !!pendingOperation && !pendingOperation.empty;
  const hasUpdates = !!pendingOperation || !!workingAnnotation.saved;
  const confirm = staged ? applyOperation : confirmAnnotation;
  const canConfirm = staged || !!workingAnnotation.saved;
  const hasStroke = !!workingAnnotationEntity.saved;

  // Combining needs a second operand from somewhere: an overlapped annotation
  // when there is a stroke, or a second click-selected annotation when not.
  const canCombine = hasStroke
    ? overlapCandidates.length > 0
    : selectionOperands.length >= 2;

  const canIntertract = hasStroke
    ? overlapCandidates.length > 0
    : selectionOverlaps;

  // Invert transforms operands where they sit, so one is enough — and it has no
  // stroke form, since inverting a mask needs no second operand.
  const canInvert = !hasStroke && selectionOperands.length >= 1;
  const numOverlapping = overlapCandidates.length;

  return {
    confirm,
    cancel,
    canConfirm,
    hasUpdates,
    canCombine,
    canInvert,
    hasStroke,
    numOverlapping,
    canIntertract,
  };
};
