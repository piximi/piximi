import { useState } from "react";
import { useDispatch, useSelector } from "react-redux";

import { Divider, List, ListItem, ListItemText, Slider } from "@mui/material";

import { AnnotationMode } from "../AnnotationMode";
import { InvertAnnotation } from "../InvertAnnotation";

import {
  AnnotatorSlice,
  quickSelectionRegionSizeSelector,
} from "store/annotator";

export const QuickAnnotationOptions = () => {
  const quickSelectionRegionSize = useSelector(
    quickSelectionRegionSizeSelector
  );

  const [regionSize, setRegionSize] = useState<number>(
    quickSelectionRegionSize
  );

  const dispatch = useDispatch();

  const onChange = (event: any, changed: number | number[]) => {
    setRegionSize(changed as number);
  };

  const onChangeCommitted = (event: any, changed: number | number[]) => {
    const payload = { quickSelectionRegionSize: changed as number };
    dispatch(AnnotatorSlice.actions.setQuickSelectionRegionSize(payload));
  };

  return (
    <>
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
                value={regionSize}
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
