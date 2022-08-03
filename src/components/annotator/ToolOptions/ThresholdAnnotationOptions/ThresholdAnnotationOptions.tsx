import { useState } from "react";
import { useSelector, useDispatch } from "react-redux";

import { Divider, List, ListItem, ListItemText, Slider } from "@mui/material";

import { useTranslation } from "hooks";

import { AnnotationMode } from "../AnnotationMode";
import { InformationBox } from "../InformationBox";
import { InvertAnnotation } from "../InvertAnnotation";

import { thresholdAnnotationValueSelector } from "store/selectors";

import { imageViewerSlice } from "store/slices";

export const ThresholdAnnotationOptions = () => {
  const t = useTranslation();

  const thresholdValue = useSelector(thresholdAnnotationValueSelector);

  const [threshold, setThreshold] = useState<number>(thresholdValue);

  const dispatch = useDispatch();

  const onChange = (event: any, changed: number | number[]) => {
    setThreshold(changed as number);

    const payload = { thresholdAnnotationValue: changed as number };
    dispatch(imageViewerSlice.actions.setThresholdAnnotationValue(payload));
  };

  return (
    <>
      <InformationBox
        description="Click and drag to create a rectangular annotation."
        name={t("Threshold annotation")}
      />

      <Divider />

      <AnnotationMode />

      <Divider />

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

      <Divider />

      <InvertAnnotation />
    </>
  );
};
