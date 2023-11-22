import React from "react";
import { useDispatch, useSelector } from "react-redux";

import { CustomListItemButton } from "components/list-items/CustomListItemButton";

import { dataSlice, selectActiveImageRawColor } from "store/slices/data";
import { selectImageStackImageIds } from "store/slices/imageViewer";
import { tensor2d } from "@tensorflow/tfjs";

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

    dispatch(dataSlice.actions.updateImages({ updates }));
  };

  return (
    <CustomListItemButton
      primaryText="Apply to all images open in annotator"
      onClick={handleApplyColorsClick}
    />
  );
};
