import Divider from "@mui/material/Divider";
import React, { useState } from "react";
import { SampleList } from "../SampleList";
import { AnnotationMode } from "../AnnotationMode";
import { InformationBox } from "../InformationBox";
import { InvertAnnotation } from "../InvertAnnotation";
import { useTranslation } from "../../../../annotator/hooks/useTranslation";
import List from "@mui/material/List";
import ListItem from "@mui/material/ListItem";
import ListItemText from "@mui/material/ListItemText";
import Slider from "@mui/material/Slider";
import { quickSelectionBrushSizeSelector } from "../../../../annotator/store/selectors/quickSelectionBrushSizeSelector";
import { applicationSlice } from "../../../../annotator/store/slices";
import { useDispatch, useSelector } from "react-redux";

export const QuickAnnotationOptions = () => {
  const t = useTranslation();

  const quickSelectionBrushSize = useSelector(quickSelectionBrushSizeSelector);

  const [brushSize, setBrushSize] = useState<number>(quickSelectionBrushSize);

  const dispatch = useDispatch();

  const onChange = (event: any, changed: number | number[]) => {
    setBrushSize(changed as number);
  };

  const onChangeCommitted = (event: any, changed: number | number[]) => {
    const payload = { quickSelectionBrushSize: changed as number };
    dispatch(applicationSlice.actions.setQuickSelectionBrushSize(payload));
  };

  return (
    <React.Fragment>
      <InformationBox description="…" name={t("Quick annotation")} />

      <Divider />

      <AnnotationMode />

      <Divider />

      <List>
        <ListItem dense>
          <ListItemText
            primary={"Brush size"}
            secondary={
              <Slider
                aria-labelledby="quick-selection-brush-size"
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
    </React.Fragment>
  );
};
