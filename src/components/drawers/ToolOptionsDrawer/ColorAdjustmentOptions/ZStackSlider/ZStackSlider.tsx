import React from "react";
import { useDispatch, useSelector } from "react-redux";

import { List, ListItem, Slider } from "@mui/material";

import { selectActiveImageRenderedSrcs } from "store/slices/imageViewer";
import {
  dataSlice,
  selectActiveImage,
  selectActiveImageActivePlane,
} from "store/slices/data";
import { CustomListItem } from "components/list-items/CustomListItem";

//TODO: change slider style

export const ZStackSlider = () => {
  const dispatch = useDispatch();
  const activeImage = useSelector(selectActiveImage);
  const activePlane = useSelector(selectActiveImageActivePlane);
  const renderedSrcs = useSelector(selectActiveImageRenderedSrcs);

  const handleChange = async (event: Event, newValue: number | number[]) => {
    if (typeof newValue === "number") {
      dispatch(
        dataSlice.actions.updateImages({
          updates: [
            {
              id: activeImage!.id,
              activePlane: newValue,
              src: renderedSrcs[newValue],
            },
          ],
        })
      );
    }
  };

  return !activeImage || activeImage!.shape.planes === 1 ? (
    <React.Fragment />
  ) : (
    <List dense>
      <CustomListItem primaryText={`Z-plane: ${activePlane}`} />

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
  );
};
