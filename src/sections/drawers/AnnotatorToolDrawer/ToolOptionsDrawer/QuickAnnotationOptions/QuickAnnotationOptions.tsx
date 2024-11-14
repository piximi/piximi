import { useState } from "react";
import { useDispatch, useSelector } from "react-redux";

import { List, ListItem, ListItemText, Slider } from "@mui/material";

import { annotatorSlice } from "store/annotator";
import { selectQuickSelectionRegionSize } from "store/annotator/selectors";
import { BaseOptions } from "../BaseOptions";

//TODO: Slider

export const QuickAnnotationOptions = () => {
  const quickSelectionRegionSize = useSelector(selectQuickSelectionRegionSize);

  const [regionSize, setRegionSize] = useState<number>(
    quickSelectionRegionSize
  );

  const dispatch = useDispatch();

  const onChange = (event: any, changed: number | number[]) => {
    setRegionSize(changed as number);
  };

  const onChangeCommitted = (event: any, changed: number | number[]) => {
    const payload = { quickSelectionRegionSize: changed as number };
    dispatch(annotatorSlice.actions.setQuickSelectionRegionSize(payload));
  };

  return (
    <BaseOptions>
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
    </BaseOptions>
  );
};
