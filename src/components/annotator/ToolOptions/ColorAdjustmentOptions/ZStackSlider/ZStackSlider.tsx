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
  const dispatch = useDispatch();
  const activeImage = useSelector(activeImageSelector);
  const channels = useSelector(activeImageColorsSelector);
  const activePlane = useSelector(activeImagePlaneSelector);

  const originalSrc = useSelector(imageOriginalSrcSelector);

  if (!activeImage || activeImage!.shape.planes === 1)
    return <React.Fragment />;

  const handleChange = async (event: Event, newValue: number | number[]) => {
    if (typeof newValue === "number") {
      if (!originalSrc) return;

      const planeData = (
        await convertImageURIsToImageData([originalSrc[newValue]])
      )[0];

      const imageSrc = mapChannelstoSpecifiedRGBImage(
        planeData,
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
          <ListItemText>Z plane: {activePlane}</ListItemText>
        </ListItem>

        <ListItem>
          <Slider
            aria-label="z-plane"
            onChange={handleChange}
            value={activePlane}
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
