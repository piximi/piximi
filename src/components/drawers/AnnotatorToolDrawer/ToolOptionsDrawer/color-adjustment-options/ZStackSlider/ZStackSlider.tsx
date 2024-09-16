import React from "react";
import { useDispatch, useSelector } from "react-redux";

import { List, ListItem, Slider } from "@mui/material";

import { selectActiveImageRenderedSrcs } from "store/imageViewer";

import { CustomListItem } from "components/list-items/CustomListItem";
import { selectActiveImage } from "store/imageViewer/reselectors";
import { dataSlice } from "store/data/dataSlice";

//TODO: change slider style

export const ZStackSlider = () => {
  const dispatch = useDispatch();
  const activeImage = useSelector(selectActiveImage);
  const renderedSrcs = useSelector(selectActiveImageRenderedSrcs);

  const handleChange = async (event: Event, newValue: number | number[]) => {
    if (typeof newValue === "number") {
      dispatch(
        dataSlice.actions.updateThings({
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
      <CustomListItem primaryText={`Z-plane: ${activeImage.activePlane}`} />

      <ListItem>
        <Slider
          aria-label="z-plane"
          onChange={handleChange}
          value={activeImage.activePlane}
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
