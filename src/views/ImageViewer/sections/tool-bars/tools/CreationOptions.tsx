import React, { useCallback } from "react";

import { useTranslation } from "hooks";
import { useDispatch, useSelector } from "react-redux";

import { FilterBAndW } from "@mui/icons-material";

import { Tool } from "components/ui";

import { annotatorSlice } from "views/ImageViewer/state/annotator";
import {
  selectAnnotationMode,
  selectWorkingAnnotationEntity,
  selectTimeLinkingState,
} from "views/ImageViewer/state/annotator/selectors";

import { AnnotationMode } from "views/ImageViewer/utils/enums";
import { selectActiveImage } from "views/ImageViewer/state/imageViewer/reselectors";
import { invert } from "views/ImageViewer/utils/annotationUtils";
import {
  CombineAnnotationsIcon,
  IntersectAnnotationsIcon,
  NewAnnotationIcon,
  SubtractAnnotationsIcon,
} from "icons";
import { Stack, SvgIcon, useTheme } from "@mui/material";
import { HelpItem } from "components/layout/HelpDrawer/HelpContent";

export const CreationOptions = () => {
  const dispatch = useDispatch();
  const t = useTranslation();
  const theme = useTheme();

  const annotationMode = useSelector(selectAnnotationMode);
  const tLinkingActive = useSelector(selectTimeLinkingState);
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

    dispatch(
      annotatorSlice.actions.updateWorkingAnnotation({
        changes: {
          boundingBox: invertedBoundingBox,
          decodedMask: invertedMask,
        },
      }),
    );
  };

  return (
    <Stack data-help={HelpItem.ObjectManipulationTools}>
      <Tool
        name={t("New Annotation")}
        onClick={() => handleModeSelection(AnnotationMode.New)}
        disabled={!workingAnnotationEntity.saved || tLinkingActive}
        selected={annotationMode === AnnotationMode.New}
        tooltipLocation="left"
      >
        <NewAnnotationIcon color={getIconColor(AnnotationMode.New)} />
      </Tool>
      <Tool
        name={t("Combine Annotations")}
        onClick={() => handleModeSelection(AnnotationMode.Add)}
        disabled={!workingAnnotationEntity.saved || tLinkingActive}
        selected={annotationMode === AnnotationMode.Add}
        tooltipLocation="left"
      >
        <CombineAnnotationsIcon color={getIconColor(AnnotationMode.Add)} />
      </Tool>

      <Tool
        name={t("Subtract Annotations")}
        onClick={() => handleModeSelection(AnnotationMode.Subtract)}
        disabled={!workingAnnotationEntity.saved || tLinkingActive}
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
        disabled={!workingAnnotationEntity.saved || tLinkingActive}
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
        disabled={!workingAnnotationEntity.saved || tLinkingActive}
        tooltipLocation="left"
      >
        <SvgIcon>
          <FilterBAndW />
        </SvgIcon>
      </Tool>
    </Stack>
  );
};
