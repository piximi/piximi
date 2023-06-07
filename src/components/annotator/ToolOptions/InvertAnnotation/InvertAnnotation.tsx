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

import { imageViewerSlice, selectWorkingAnnotation } from "store/imageViewer";
import { dataSlice } from "store/data";

import { ReactComponent as InvertSelectionIcon } from "icons/InvertAnnotation.svg";
import { encode } from "utils/annotator";

export const InvertAnnotation = () => {
  const dispatch = useDispatch();

  const { annotationTool } = useAnnotationTool();
  const workingAnnotationEntity = useSelector(selectWorkingAnnotation);

  const onInvertClick = () => {
    if (!annotationTool || !workingAnnotationEntity.saved) return;
    const workingAnnotation = {
      ...workingAnnotationEntity.saved,
      ...workingAnnotationEntity.changes,
    };
    if (!workingAnnotation.maskData) return;

    const [invertedMask, invertedBoundingBox] = annotationTool.invert(
      workingAnnotation.maskData,
      workingAnnotation.boundingBox
    );

    const mask = encode(invertedMask);

    dispatch(
      dataSlice.actions.updateAnnotation({
        annotationId: workingAnnotation.id,
        updates: { mask, boundingBox: invertedBoundingBox },
      })
    );

    dispatch(
      imageViewerSlice.actions.setSelectedAnnotationIds({
        annotationIds: [workingAnnotation.id],
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
