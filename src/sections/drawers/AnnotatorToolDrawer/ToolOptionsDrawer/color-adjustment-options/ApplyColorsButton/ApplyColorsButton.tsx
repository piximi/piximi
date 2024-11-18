import React from "react";
import { useDispatch, useSelector } from "react-redux";

import { CustomListItemButton } from "components/CustomListItemButton";

import { tensor2d } from "@tensorflow/tfjs";
import { dataSlice } from "store/data/dataSlice";
import { selectActiveImageRawColor } from "store/imageViewer/reselectors";
import { selectImageStackImageIds } from "store/imageViewer/selectors";

export const ApplyColorsButton = () => {
  const activeImageColors = useSelector(selectActiveImageRawColor);
  const imageIds = useSelector(selectImageStackImageIds);
  const dispatch = useDispatch();

  const handleApplyColorsClick = async () => {
    const updates = imageIds.map((id) => {
      return {
        id,
        colors: {
          ...activeImageColors,
          color: tensor2d(activeImageColors.color),
        },
      };
    });

    dispatch(dataSlice.actions.updateThings({ updates }));
  };

  return (
    <CustomListItemButton
      primaryText="Apply to all images open in annotator"
      onClick={handleApplyColorsClick}
    />
  );
};
