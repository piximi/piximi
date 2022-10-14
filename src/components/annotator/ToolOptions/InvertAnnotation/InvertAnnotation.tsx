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

import {
  imageViewerSlice,
  selectedAnnotationSelector,
} from "store/image-viewer";

import { ReactComponent as InvertSelectionIcon } from "icons/InvertAnnotation.svg";

export const InvertAnnotation = () => {
  const dispatch = useDispatch();

  const [annotationTool] = useAnnotationTool();
  const selectedAnnotation = useSelector(selectedAnnotationSelector);

  const onInvertClick = () => {
    if (!annotationTool) return;

    if (!selectedAnnotation || !selectedAnnotation.maskData) return;

    const [invertedMask, invertedBoundingBox] = annotationTool.invert(
      selectedAnnotation.maskData,
      selectedAnnotation.boundingBox
    );

    dispatch(
      imageViewerSlice.actions.setSelectedAnnotations({
        selectedAnnotations: [
          {
            ...selectedAnnotation,
            boundingBox: invertedBoundingBox,
            maskData: invertedMask,
          },
        ],
        selectedAnnotation: {
          ...selectedAnnotation,
          boundingBox: invertedBoundingBox,
          maskData: invertedMask,
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
