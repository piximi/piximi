import { useDispatch, useSelector } from "react-redux";

import { Divider, List, ListItem, ListItemText, Slider } from "@mui/material";

import { AnnotationMode } from "../AnnotationMode";
import { InvertAnnotation } from "../InvertAnnotation";

import {
  imageViewerSlice,
  penSelectionBrushSizeSelector,
} from "store/imageViewer";

export const PenSelectionIconOptions = () => {
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
      <Divider />

      <AnnotationMode />

      <Divider />

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

      <Divider />

      <InvertAnnotation />
    </>
  );
};
