import React from "react";
import { useDispatch, useSelector } from "react-redux";

import { List, ListItem, ListItemText, Slider } from "@mui/material";

import {
  AnnotatorSlice,
  activeImageSelector,
  activeImagePlaneSelector,
} from "store/annotator";

export const ZStackSlider = () => {
  const dispatch = useDispatch();
  const activeImage = useSelector(activeImageSelector);
  const activePlane = useSelector(activeImagePlaneSelector);

  if (!activeImage || activeImage!.shape.planes === 1)
    return <React.Fragment />;

  const handleChange = async (event: Event, newValue: number | number[]) => {
    if (typeof newValue === "number") {
      dispatch(
        AnnotatorSlice.actions.setActiveImagePlane({
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
