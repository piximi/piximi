import {
  List,
  ListItem,
  ListItemText,
  Slider,
  Typography,
} from "@mui/material";
import React, { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { activeImagePlaneSelector } from "../../../../../store/selectors/activeImagePlaneSelector";
import { activeImageSelector } from "../../../../../store/selectors/activeImageSelector";
import { imageViewerSlice } from "../../../../../store/slices";

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
      const src = activeImage.originalSrc[newValue];
      dispatch(imageViewerSlice.actions.setImageSrc({ src: src }));
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
