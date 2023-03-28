import React from "react";
import { useDispatch, useSelector } from "react-redux";

import { List, ListItem, ListItemText, Slider } from "@mui/material";

import { activeImageRenderedSrcsSelector } from "store/annotator";
import {
  dataSlice,
  selectActiveImage,
  selectActiveImageActivePlane,
} from "store/data";

export const ZStackSlider = () => {
  const dispatch = useDispatch();
  const activeImage = useSelector(selectActiveImage);
  const activePlane = useSelector(selectActiveImageActivePlane);
  const renderedSrcs = useSelector(activeImageRenderedSrcsSelector);

  if (!activeImage || activeImage!.shape.planes === 1)
    return <React.Fragment />;

  const handleChange = async (event: Event, newValue: number | number[]) => {
    if (typeof newValue === "number") {
      dispatch(
        dataSlice.actions.setImageActivePlane({
          imageId: activeImage.id,
          activePlane: newValue,
          renderedSrc: renderedSrcs[newValue],
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
