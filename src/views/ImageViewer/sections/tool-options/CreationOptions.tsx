import React from "react";

import { useTranslation } from "hooks";
import { useDispatch, useSelector } from "react-redux";

import {
  JoinFull,
  JoinInner,
  Add,
  Remove,
  FilterBAndW,
} from "@mui/icons-material";

import { Tool } from "../../components";

import { annotatorSlice } from "views/ImageViewer/state/annotator";
import {
  selectAnnotationMode,
  selectWorkingAnnotationEntity,
} from "views/ImageViewer/state/annotator/selectors";

import { AnnotationMode } from "views/ImageViewer/utils/enums";
import { FlexRowBox } from "components/ui";
import { selectActiveImage } from "views/ImageViewer/state/annotator/reselectors";
import { invert } from "views/ImageViewer/utils/annotationUtils";
import { encode } from "views/ImageViewer/utils";

export const CreationOptions = () => {
  const dispatch = useDispatch();
  const t = useTranslation();

  const annotationMode = useSelector(selectAnnotationMode);
  const workingAnnotationEntity = useSelector(selectWorkingAnnotationEntity);
  const image = useSelector(selectActiveImage);

  const handleModeSelection = (mode: AnnotationMode) => {
    if (annotationMode !== mode)
      dispatch(
        annotatorSlice.actions.setAnnotationMode({
          annotationMode: mode,
        })
      );
  };

  //TODO: not working, but will fix after annotation handling refector
  const handleInvertAnnotation = () => {
    if (!workingAnnotationEntity.saved || !image) return;
    const workingAnnotation = {
      ...workingAnnotationEntity.saved,
      ...workingAnnotationEntity.changes,
    };
    if (!workingAnnotation.decodedMask) return;

    const [invertedMask, invertedBoundingBox] = invert(
      workingAnnotation.decodedMask,
      workingAnnotation.boundingBox,
      image.shape.width,
      image.shape.height
    );

    const encodedMask = encode(invertedMask);

    dispatch(
      annotatorSlice.actions.editThings({
        updates: [
          {
            id: workingAnnotation.id,
            encodedMask,
            boundingBox: invertedBoundingBox,
          },
        ],
      })
    );

    dispatch(
      annotatorSlice.actions.setSelectedAnnotationIds({
        annotationIds: [workingAnnotation.id],
        workingAnnotationId: workingAnnotation.id,
      })
    );
  };

  return (
    <FlexRowBox>
      <Tool
        name={t("Invert Annotation")}
        onClick={() => {
          handleInvertAnnotation();
        }}
        disabled={!workingAnnotationEntity.saved}
      >
        <FilterBAndW />
      </Tool>
      <Tool
        name={t("New Annotation")}
        onClick={() => handleModeSelection(AnnotationMode.New)}
        disabled={!workingAnnotationEntity.saved}
        selected={annotationMode === AnnotationMode.New}
      >
        <Add />
      </Tool>
      <Tool
        name={t("Combine Annotations")}
        onClick={() => handleModeSelection(AnnotationMode.Add)}
        disabled={!workingAnnotationEntity.saved}
        selected={annotationMode === AnnotationMode.Add}
      >
        <Remove />
      </Tool>
      <Tool
        name={t("Subtract Annotations")}
        onClick={() => handleModeSelection(AnnotationMode.Subtract)}
        disabled={!workingAnnotationEntity.saved}
        selected={annotationMode === AnnotationMode.Subtract}
      >
        <JoinFull />
      </Tool>
      <Tool
        name={t("Annotation Intersection")}
        onClick={() => handleModeSelection(AnnotationMode.Intersect)}
        disabled={!workingAnnotationEntity.saved}
        selected={annotationMode === AnnotationMode.Intersect}
      >
        <JoinInner />
      </Tool>
    </FlexRowBox>
  );
};
