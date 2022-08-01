import React from "react";
import { useDispatch, useSelector } from "react-redux";

import List from "@mui/material/List";
import ListItem from "@mui/material/ListItem";
import ListItemIcon from "@mui/material/ListItemIcon";
import SvgIcon from "@mui/material/SvgIcon";
import ListItemText from "@mui/material/ListItemText";

import { useAnnotationTool } from "hooks";
import { useTranslation } from "hooks/useTranslation";

import { selectedAnnotationSelector } from "store/selectors/selectedAnnotationSelector";

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
