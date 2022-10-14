import { useEffect, useState } from "react";
import { useSelector, useDispatch } from "react-redux";

import { Divider, List, ListItem, ListItemText, Slider } from "@mui/material";

import { useTranslation } from "hooks";

import { AnnotationMode } from "../AnnotationMode";
import { InformationBox } from "../InformationBox";
import { InvertAnnotation } from "../InvertAnnotation";

import {
  imageViewerSlice,
  thresholdAnnotationValueSelector,
} from "store/image-viewer";

export const ThresholdAnnotationOptions = () => {
  const t = useTranslation();

  const thresholdValue = useSelector(thresholdAnnotationValueSelector);

  const [threshold, setThreshold] = useState<number>(thresholdValue);

  const dispatch = useDispatch();

  const onChange = (event: any, changed: number | number[]) => {
    setThreshold(changed as number);
  };

  useEffect(() => {
    const payload = { thresholdAnnotationValue: threshold };
    dispatch(imageViewerSlice.actions.setThresholdAnnotationValue(payload));
  }, [dispatch, threshold]);

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
