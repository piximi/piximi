import React from "react";
import { tensor2d } from "@tensorflow/tfjs";
import { useDispatch, useSelector } from "react-redux";

import { CustomListItemButton } from "components/ui/CustomListItemButton";

import { annotatorSlice } from "views/ImageViewer/state/annotator";
import { selectActiveImageRawColor } from "views/ImageViewer/state/imageViewer/reselectors";
import { selectImageStackImageIds } from "views/ImageViewer/state/imageViewer/selectors";

export const ApplyColorsButton = () => {
  const activeImageColors = useSelector(selectActiveImageRawColor);
  const imageIds = useSelector(selectImageStackImageIds);
  const dispatch = useDispatch();

  const handleApplyColorsClick = async () => {
    const updates = Object.keys(imageIds).map((id) => {
      return {
        id,
        colors: {
          ...activeImageColors,
          color: tensor2d(activeImageColors.color),
        },
      };
    });

    dispatch(annotatorSlice.actions.editThings({ updates }));
  };

  return (
    <CustomListItemButton
      primaryText="Apply to all images open in annotator"
      onClick={handleApplyColorsClick}
    />
  );
};
