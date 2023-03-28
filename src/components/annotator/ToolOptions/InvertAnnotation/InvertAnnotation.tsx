import React from "react";
import { useDispatch, useSelector } from "react-redux";

import {
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  SvgIcon,
} from "@mui/material";

import { useAnnotationTool, useTranslation } from "hooks";

import { AnnotatorSlice } from "store/annotator";
import { DataSlice, selectWorkingAnnotation } from "store/data";

import { ReactComponent as InvertSelectionIcon } from "icons/InvertAnnotation.svg";
import { encode } from "utils/annotator";

export const InvertAnnotation = () => {
  const dispatch = useDispatch();

  const [annotationTool] = useAnnotationTool();
  const workingAnnotation = useSelector(selectWorkingAnnotation);

  const onInvertClick = () => {
    if (!annotationTool) return;

    if (!workingAnnotation || !workingAnnotation.maskData) return;

    const [invertedMask, invertedBoundingBox] = annotationTool.invert(
      workingAnnotation.maskData,
      workingAnnotation.boundingBox
    );

    const mask = encode(invertedMask);

    dispatch(
      DataSlice.actions.updateAnnotation({
        annotationId: workingAnnotation.id,
        updates: { mask, boundingBox: invertedBoundingBox },
      })
    );

    dispatch(
      AnnotatorSlice.actions.setSelectedAnnotationIds({
        selectedAnnotationIds: [workingAnnotation.id],
        workingAnnotationId: workingAnnotation.id,
      })
    );
  };

  const t = useTranslation();

  return (
    <List>
      <ListItem button onClick={onInvertClick} dense>
        <ListItemIcon>
          <SvgIcon>
            <>
              <InvertSelectionIcon />
            </>
          </SvgIcon>
        </ListItemIcon>

        <ListItemText primary={t("Invert annotation")} />
      </ListItem>
    </List>
  );
};
