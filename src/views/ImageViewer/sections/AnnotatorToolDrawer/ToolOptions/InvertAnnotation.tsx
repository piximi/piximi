import React from "react";
import { useDispatch, useSelector } from "react-redux";
import { List, SvgIcon } from "@mui/material";

import { useTranslation } from "hooks";
import { useAnnotationTool } from "../../../hooks";

import { CustomListItemButton } from "components/ui";

import { annotatorSlice } from "views/ImageViewer/state/annotator";
import { selectWorkingAnnotation } from "views/ImageViewer/state/annotator/selectors";

import { ReactComponent as InvertSelectionIcon } from "icons/InvertAnnotation.svg";

import { encode } from "views/ImageViewer/utils";

//TODO: change to listItem

export const InvertAnnotation = () => {
  const dispatch = useDispatch();

  const { annotationTool } = useAnnotationTool();
  const workingAnnotationEntity = useSelector(selectWorkingAnnotation);

  const handleInvertClick = () => {
    if (!workingAnnotationEntity.saved) return;
    const workingAnnotation = {
      ...workingAnnotationEntity.saved,
      ...workingAnnotationEntity.changes,
    };
    if (!workingAnnotation.decodedMask) return;

    const [invertedMask, invertedBoundingBox] = annotationTool.invert(
      workingAnnotation.decodedMask,
      workingAnnotation.boundingBox
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

  const t = useTranslation();

  return (
    <List>
      <CustomListItemButton
        primaryText={t("Invert annotation")}
        onClick={handleInvertClick}
        icon={
          <SvgIcon>
            <InvertSelectionIcon />
          </SvgIcon>
        }
        dense
      />
    </List>
  );
};
