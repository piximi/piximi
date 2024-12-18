import { useEffect, useState } from "react";
import { useSelector, useDispatch } from "react-redux";
import { List, ListItem, ListItemText, Slider } from "@mui/material";

import { BaseOptions } from "./BaseOptions";

import { annotatorSlice } from "views/ImageViewer/state/annotator";
import { selectThresholdAnnotationValue } from "views/ImageViewer/state/annotator/selectors";

//TODO: Slider

export const ThresholdAnnotationOptions = () => {
  const thresholdValue = useSelector(selectThresholdAnnotationValue);

  const [threshold, setThreshold] = useState<number>(thresholdValue);

  const dispatch = useDispatch();

  const onChange = (event: any, changed: number | number[]) => {
    setThreshold(changed as number);
  };

  useEffect(() => {
    const payload = { thresholdAnnotationValue: threshold };
    dispatch(annotatorSlice.actions.setThresholdAnnotationValue(payload));
  }, [dispatch, threshold]);

  return (
    <BaseOptions>
      <List>
        <ListItem dense>
          <ListItemText
            primary={"Threshold value"}
            secondary={
              <Slider
                valueLabelDisplay="auto"
                aria-labelledby="threshold-value"
                min={1}
                max={255}
                onChange={onChange}
                value={threshold}
              />
            }
          />
        </ListItem>
      </List>
    </BaseOptions>
  );
};
