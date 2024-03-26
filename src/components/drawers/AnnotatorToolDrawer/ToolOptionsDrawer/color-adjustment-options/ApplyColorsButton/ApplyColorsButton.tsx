import React from "react";
import { useDispatch, useSelector } from "react-redux";

import { CustomListItemButton } from "components/list-items/CustomListItemButton";

import { selectImageStackImageIds } from "store/slices/imageViewer";
import { tensor2d } from "@tensorflow/tfjs";
import { newDataSlice } from "store/slices/newData/newDataSlice";
import { selectActiveImageRawColor } from "store/slices/imageViewer/reselectors";

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

    dispatch(newDataSlice.actions.updateThings({ updates }));
  };

  return (
    <CustomListItemButton
      primaryText="Apply to all images open in annotator"
      onClick={handleApplyColorsClick}
    />
  );
};
