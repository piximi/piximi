import { useState } from "react";
import { useDispatch, useSelector } from "react-redux";

import { Divider, List, ListItem, ListItemText, Slider } from "@mui/material";

import { useTranslation } from "hooks";

import { AnnotationMode } from "../AnnotationMode";
import { InformationBox } from "../InformationBox";
import { InvertAnnotation } from "../InvertAnnotation";

import {
  imageViewerSlice,
  quickSelectionRegionSizeSelector,
} from "store/image-viewer";

export const QuickAnnotationOptions = () => {
  const t = useTranslation();

  const quickSelectionRegionSize = useSelector(
    quickSelectionRegionSizeSelector
  );

  const [brushSize, setBrushSize] = useState<number>(quickSelectionRegionSize);

  const dispatch = useDispatch();

  const onChange = (event: any, changed: number | number[]) => {
    setBrushSize(changed as number);
  };

  const onChangeCommitted = (event: any, changed: number | number[]) => {
    const payload = { quickSelectionBrushSize: changed as number };
    dispatch(imageViewerSlice.actions.setQuickSelectionBrushSize(payload));
  };

  return (
    <>
      <InformationBox description="…" name={t("Quick annotation")} />

      <Divider />

      <AnnotationMode />

      <Divider />

      <List>
        <ListItem dense>
          <ListItemText
            primary={"Region size"}
            secondary={
              <Slider
                aria-labelledby="quick-selection-region-size"
                min={2}
                onChange={onChange}
                onChangeCommitted={onChangeCommitted}
                value={brushSize}
              />
            }
          />
        </ListItem>
      </List>

      <Divider />

      <InvertAnnotation />

      {/*<Divider />*/}

      {/*<SampleList />*/}
    </>
  );
};
