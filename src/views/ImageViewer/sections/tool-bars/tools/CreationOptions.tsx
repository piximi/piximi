import React, { useCallback } from "react";

import { useTranslation } from "hooks";
import { useDispatch, useSelector } from "react-redux";

import { FilterBAndW } from "@mui/icons-material";

import { Tool } from "../../../components";

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
    (annotationMode: AnnotationMode) => {
      return !workingAnnotationEntity.saved
        ? theme.palette.action.disabled
        : annotationMode === AnnotationMode.New
          ? theme.palette.primary.dark
          : theme.palette.text.primary;
    },
    [theme, workingAnnotationEntity.saved],
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
    <FlexRowBox>
      <Tool
        name={t("Invert Annotation")}
        onClick={() => {
          handleInvertAnnotation();
        }}
        disabled={!workingAnnotationEntity.saved}
      >
        <SvgIcon>
          <FilterBAndW />
        </SvgIcon>
      </Tool>
      <Tool
        name={t("New Annotation")}
        onClick={() => handleModeSelection(AnnotationMode.New)}
        disabled={!workingAnnotationEntity.saved}
        selected={annotationMode === AnnotationMode.New}
      >
        <NewAnnotationIcon color={getIconColor(AnnotationMode.New)} />
      </Tool>
      <Tool
        name={t("Combine Annotations")}
        onClick={() => handleModeSelection(AnnotationMode.Add)}
        disabled={!workingAnnotationEntity.saved}
        selected={annotationMode === AnnotationMode.Add}
      >
        <CombineAnnotationsIcon color={getIconColor(AnnotationMode.Add)} />
      </Tool>
      <Tool
        name={t("Subtract Annotations")}
        onClick={() => handleModeSelection(AnnotationMode.Subtract)}
        disabled={!workingAnnotationEntity.saved}
        selected={annotationMode === AnnotationMode.Subtract}
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
      >
        <IntersectAnnotationsIcon
          color={getIconColor(AnnotationMode.Intersect)}
        />
      </Tool>
    </FlexRowBox>
  );
};
