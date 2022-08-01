import React from "react";
import { useDispatch, useSelector } from "react-redux";

import Divider from "@mui/material/Divider";
import Slider from "@mui/material/Slider";
import List from "@mui/material/List";
import ListItem from "@mui/material/ListItem";
import ListItemText from "@mui/material/ListItemText";

import { SelectionOptions } from "../SelectionOptions";

import { penSelectionBrushSizeSelector } from "store/selectors/penSelectionBrushSizeSelector";
import { imageViewerSlice } from "store/slices";

export const FreehandSelectionOptions = () => {
  const dispatch = useDispatch();

  const penSelectionBrushSizeBrushSize = useSelector(
    penSelectionBrushSizeSelector
  );

  const onChange = (event: any, changed: number | number[]) => {
    const payload = { penSelectionBrushSize: changed as number };

    dispatch(imageViewerSlice.actions.setPenSelectionBrushSize(payload));
  };

  return (
    <>
      <SelectionOptions />

      <Divider />

      <List>
        <ListItem dense>
          <ListItemText
            primary={"Brush size"}
            secondary={
              <Slider
                aria-labelledby="pen-selection-brush-size"
                onChange={onChange}
                value={penSelectionBrushSizeBrushSize}
              />
            }
          />
        </ListItem>
      </List>
    </>
  );
};
