import { useDispatch, useSelector } from "react-redux";

import { List, ListItem, ListItemText, Slider } from "@mui/material";

import { BaseOptions } from "./BaseOptions";

import { annotatorSlice } from "store/annotator";
import { selectPenSelectionBrushSize } from "store/annotator/selectors";

//TODO: Slider

export const PenSelectionIconOptions = () => {
  const dispatch = useDispatch();

  const penSelectionBrushSizeBrushSize = useSelector(
    selectPenSelectionBrushSize
  );

  const onChange = (event: any, changed: number | number[]) => {
    const payload = { penSelectionBrushSize: changed as number };

    dispatch(annotatorSlice.actions.setPenSelectionBrushSize(payload));
  };

  return (
    <BaseOptions>
      <List>
        <ListItem dense>
          <ListItemText
            primary={"Brush size"}
            secondary={
              <Slider
                valueLabelDisplay="auto"
                aria-labelledby="pen-selection-brush-size"
                min={1}
                max={25}
                onChange={onChange}
                value={penSelectionBrushSizeBrushSize}
              />
            }
          />
        </ListItem>
      </List>
    </BaseOptions>
  );
};
