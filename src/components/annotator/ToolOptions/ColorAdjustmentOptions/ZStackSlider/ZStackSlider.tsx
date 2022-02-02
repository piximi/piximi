import { List, ListItem, ListItemText, Slider } from "@mui/material";
import React, { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { activeImagePlaneSelector } from "../../../../../store/selectors/activeImagePlaneSelector";
import { activeImageSelector } from "../../../../../store/selectors/activeImageSelector";
import { imageViewerSlice } from "../../../../../store/slices";
import { mapChannelstoSpecifiedRGBImage } from "../../../../../image/imageHelper";
import { activeImageColorsSelector } from "../../../../../store/selectors/activeImageColorsSelector";

type ZStackSliderProps = {
  originalData: Array<Array<Array<number>>>;
};

export const ZStackSlider = ({ originalData }: ZStackSliderProps) => {
  const activeImagePlane = useSelector(activeImagePlaneSelector);
  const activeImage = useSelector(activeImageSelector);
  const dispatch = useDispatch();
  const channels = useSelector(activeImageColorsSelector);

  const [value, setValue] = useState(activeImagePlane);

  if (!activeImage || activeImage!.shape.planes === 1)
    return <React.Fragment />;

  const handleChange = (event: Event, newValue: number | number[]) => {
    if (typeof newValue === "number") {
      setValue(newValue);
      const imageData = originalData[newValue];

      const imageSrc = mapChannelstoSpecifiedRGBImage(
        imageData,
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
