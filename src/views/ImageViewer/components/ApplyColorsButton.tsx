import React from "react";
import { useDispatch, useSelector } from "react-redux";

import { CustomListItemButton } from "components/ui/CustomListItemButton";

import { selectActiveImageRawColor } from "../state/image-viewer-data/reselectors";
import { selectMetadataStack } from "../state/image-viewer-data/selectors";
import { dataSlice } from "store/data";

export const ApplyColorsButton = () => {
  const activeImageColors = useSelector(selectActiveImageRawColor);
  const imageIds = useSelector(selectMetadataStack);
  const dispatch = useDispatch();

  const handleApplyColorsClick = async () => {
    const updates = Object.keys(imageIds).map((id) => {
      return {
        id,
        changes: {
          colors: {
            ...activeImageColors,
          },
        },
      };
    });

    dispatch(dataSlice.actions.batchUpdateImageData(updates));
  };

  return (
    <CustomListItemButton
      primaryText="Apply to all images open in annotator"
      onClick={handleApplyColorsClick}
    />
  );
};
