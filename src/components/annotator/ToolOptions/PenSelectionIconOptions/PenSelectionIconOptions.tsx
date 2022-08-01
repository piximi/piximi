import { useDispatch, useSelector } from "react-redux";

import Divider from "@mui/material/Divider";
import List from "@mui/material/List";
import ListItem from "@mui/material/ListItem";
import ListItemText from "@mui/material/ListItemText";
import Slider from "@mui/material/Slider";

import { useTranslation } from "hooks/useTranslation";

import { AnnotationMode } from "../AnnotationMode";
import { InformationBox } from "../InformationBox";
import { InvertAnnotation } from "../InvertAnnotation";

import { penSelectionBrushSizeSelector } from "store/selectors/penSelectionBrushSizeSelector";

import { imageViewerSlice } from "store/slices";

export const PenSelectionIconOptions = () => {
  const dispatch = useDispatch();

  const penSelectionBrushSizeBrushSize = useSelector(
    penSelectionBrushSizeSelector
  );

  const onChange = (event: any, changed: number | number[]) => {
    const payload = { penSelectionBrushSize: changed as number };

    dispatch(imageViewerSlice.actions.setPenSelectionBrushSize(payload));
  };

  const t = useTranslation();

  return (
    <>
      <InformationBox description="…" name={t("Freehand annotation")} />

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
