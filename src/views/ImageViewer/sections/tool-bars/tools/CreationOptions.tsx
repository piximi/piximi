import React, { useCallback } from "react";

import { useTranslation } from "hooks";
import { useDispatch, useSelector } from "react-redux";

import { FilterBAndW } from "@mui/icons-material";

import { Tool } from "components/ui";

import { annotatorSlice } from "views/ImageViewer/state/annotator";
import {
  selectAnnotationMode,
  selectWorkingAnnotationEntity,
} from "views/ImageViewer/state/annotator/selectors";

import { AnnotationMode } from "views/ImageViewer/utils/enums";
import { FlexColumnBox } from "components/ui";
import { selectActiveImage } from "views/ImageViewer/state/annotator/reselectors";
import { invert } from "views/ImageViewer/utils/annotationUtils";
import { encode } from "views/ImageViewer/utils";
import {
  CombineAnnotationsIcon,
  IntersectAnnotationsIcon,
  NewAnnotationIcon,
  SubtractAnnotationsIcon,
} from "icons";
import { SvgIcon, useTheme } from "@mui/material";

export const CreationOptions = () => {
  const dispatch = useDispatch();
  const t = useTranslation();
  const theme = useTheme();

  const annotationMode = useSelector(selectAnnotationMode);
  const workingAnnotationEntity = useSelector(selectWorkingAnnotationEntity);
  const image = useSelector(selectActiveImage);

  const handleModeSelection = (mode: AnnotationMode) => {
    if (annotationMode !== mode)
      dispatch(
        annotatorSlice.actions.setAnnotationMode({
          annotationMode: mode,
        }),
      );
  };

  const getIconColor = useCallback(
    (mode: AnnotationMode) => {
      if (mode === AnnotationMode.New && mode === annotationMode) {
        return theme.palette.primary.dark;
      }
      if (workingAnnotationEntity.saved) {
        if (mode === annotationMode) {
          return theme.palette.primary.dark;
        } else {
          return theme.palette.action.active;
        }
      }
      return theme.palette.action.disabled;
    },
    [theme, workingAnnotationEntity.saved, annotationMode],
  );

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
      image.shape.height,
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
      }),
    );

    dispatch(
      annotatorSlice.actions.setSelectedAnnotationIds({
        annotationIds: [workingAnnotation.id],
        workingAnnotationId: workingAnnotation.id,
      }),
    );
  };

  return (
    <FlexColumnBox>
      <Tool
        name={t("New Annotation")}
        onClick={() => handleModeSelection(AnnotationMode.New)}
        disabled={!workingAnnotationEntity.saved}
        selected={annotationMode === AnnotationMode.New}
        tooltipLocation="left"
      >
        <NewAnnotationIcon color={getIconColor(AnnotationMode.New)} />
      </Tool>
      <Tool
        name={t("Combine Annotations")}
        onClick={() => handleModeSelection(AnnotationMode.Add)}
        disabled={!workingAnnotationEntity.saved}
        selected={annotationMode === AnnotationMode.Add}
        tooltipLocation="left"
      >
        <CombineAnnotationsIcon color={getIconColor(AnnotationMode.Add)} />
      </Tool>

      <Tool
        name={t("Subtract Annotations")}
        onClick={() => handleModeSelection(AnnotationMode.Subtract)}
        disabled={!workingAnnotationEntity.saved}
        selected={annotationMode === AnnotationMode.Subtract}
        tooltipLocation="left"
      >
        <SubtractAnnotationsIcon
          color={getIconColor(AnnotationMode.Subtract)}
        />
      </Tool>
      <Tool
        name={t("Annotation Intersection")}
        onClick={() => handleModeSelection(AnnotationMode.Intersect)}
        disabled={!workingAnnotationEntity.saved}
        selected={annotationMode === AnnotationMode.Intersect}
        tooltipLocation="left"
      >
        <IntersectAnnotationsIcon
          color={getIconColor(AnnotationMode.Intersect)}
        />
      </Tool>
      <Tool
        name={t("Invert Annotation")}
        onClick={() => {
          handleInvertAnnotation();
        }}
        disabled={!workingAnnotationEntity.saved}
        tooltipLocation="left"
      >
        <SvgIcon>
          <FilterBAndW />
        </SvgIcon>
      </Tool>
    </FlexColumnBox>
  );
};
