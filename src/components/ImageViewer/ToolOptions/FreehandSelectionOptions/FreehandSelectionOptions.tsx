import React from "react";
import { SelectionOptions } from "../SelectionOptions";
import Divider from "@mui/material/Divider";
import Slider from "@mui/material/Slider";
import { useDispatch, useSelector } from "react-redux";
import { imageViewerSlice } from "../../../../store/slices";
import { penSelectionBrushSizeSelector } from "../../../../store/selectors/penSelectionBrushSizeSelector";
import List from "@mui/material/List";
import ListItem from "@mui/material/ListItem";
import ListItemText from "@mui/material/ListItemText";

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
