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

import { selectedAnnotationSelector } from "store/selectors";

import { imageViewerSlice } from "store/slices";

import { ReactComponent as InvertSelectionIcon } from "icons/InvertAnnotation.svg";

export const InvertAnnotation = () => {
  const dispatch = useDispatch();

  const [annotationTool] = useAnnotationTool();
  const selectedAnnotation = useSelector(selectedAnnotationSelector);

  const onInvertClick = () => {
    if (!annotationTool) return;

    if (!selectedAnnotation || !selectedAnnotation.mask) return;

    const [invertedMask, invertedBoundingBox] = annotationTool.invert(
      selectedAnnotation.mask,
      selectedAnnotation.boundingBox
    );

    dispatch(
      imageViewerSlice.actions.setSelectedAnnotations({
        selectedAnnotations: [
          {
            ...selectedAnnotation,
            boundingBox: invertedBoundingBox,
            mask: invertedMask,
          },
        ],
        selectedAnnotation: {
          ...selectedAnnotation,
          boundingBox: invertedBoundingBox,
          mask: invertedMask,
        },
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
