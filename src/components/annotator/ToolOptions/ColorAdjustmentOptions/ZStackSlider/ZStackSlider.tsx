import { List, ListItem, ListItemText, Slider } from "@mui/material";
import React, { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { activeImagePlaneSelector } from "../../../../../store/selectors/activeImagePlaneSelector";
import { activeImageSelector } from "../../../../../store/selectors/activeImageSelector";
import { imageViewerSlice } from "../../../../../store/slices";
import { DEFAULT_COLORS } from "../../../../../types/Colors";
import {
  convertImageDataToURI,
  mapChannelstoSpecifiedRGBImage,
} from "../../../../../image/imageHelper";

export const ZStackSlider = () => {
  const activeImagePlane = useSelector(activeImagePlaneSelector);
  const activeImage = useSelector(activeImageSelector);
  const dispatch = useDispatch();

  const [value, setValue] = useState(activeImagePlane);

  if (!activeImage || activeImage!.shape.planes === 1)
    return <React.Fragment />;

  const handleChange = (event: Event, newValue: number | number[]) => {
    if (typeof newValue === "number") {
      setValue(newValue);
      const imageData = activeImage.originalSrc[newValue];
      let imageSrc: string;

      if (activeImage.shape.channels === 1) {
        //if greyscale image, no need for any color re-mapping
        imageSrc = convertImageDataToURI(
          activeImage.shape.width,
          activeImage.shape.height,
          imageData[0],
          1,
          0
        );
      } else {
        const colors = DEFAULT_COLORS; //TODO this should actually be imageViewers.colors., which is the color mapping specified by user (once you add that to state)
        imageSrc = mapChannelstoSpecifiedRGBImage(
          imageData,
          colors,
          activeImage.shape.height,
          activeImage.shape.width
        );
      }

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
          <ListItemText>Z plane: {value}</ListItemText>
        </ListItem>

        <ListItem>
          <Slider
            aria-label="z-plane"
            onChange={handleChange}
            value={value}
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
