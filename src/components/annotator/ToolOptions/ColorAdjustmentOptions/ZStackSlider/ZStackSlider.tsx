import { List, ListItem, ListItemText, Slider } from "@mui/material";
import React from "react";
import { useDispatch, useSelector } from "react-redux";
import { activeImageSelector } from "../../../../../store/selectors/activeImageSelector";
import { imageViewerSlice } from "../../../../../store/slices";
import {
  convertImageURIsToImageData,
  mapChannelstoSpecifiedRGBImage,
} from "../../../../../image/imageHelper";
import { activeImageColorsSelector } from "../../../../../store/selectors/activeImageColorsSelector";
import { imageOriginalSrcSelector } from "../../../../../store/selectors";
import { activeImagePlaneSelector } from "../../../../../store/selectors/activeImagePlaneSelector";

export const ZStackSlider = () => {
  const activeImage = useSelector(activeImageSelector);
  const dispatch = useDispatch();
  const channels = useSelector(activeImageColorsSelector);
  const activeSlice = useSelector(activeImagePlaneSelector);

  const originalSrc = useSelector(imageOriginalSrcSelector);

  if (!activeImage || activeImage!.shape.planes === 1)
    return <React.Fragment />;

  const handleChange = async (event: Event, newValue: number | number[]) => {
    if (typeof newValue === "number") {
      if (!originalSrc) return;

      const planeData = await convertImageURIsToImageData([
        originalSrc[newValue],
      ]);

      const imageSrc = mapChannelstoSpecifiedRGBImage(
        planeData[0],
        channels,
        activeImage.shape.height,
        activeImage.shape.width
      );

      dispatch(
        imageViewerSlice.actions.setImageSrc({
          src: imageSrc,
        })
      );
      dispatch(
        imageViewerSlice.actions.setActiveImagePlane({
          activeImagePlane: newValue,
        })
      );
    }
  };

  return (
    <React.Fragment>
      <List dense>
        <ListItem>
          <ListItemText>Z plane: {activeSlice}</ListItemText>
        </ListItem>

        <ListItem>
          <Slider
            aria-label="z-plane"
            onChange={handleChange}
            value={activeSlice}
            valueLabelDisplay="auto"
            step={1}
            marks
            min={0}
            max={activeImage!.shape.planes - 1}
          />
        </ListItem>
      </List>
    </React.Fragment>
  );
};
