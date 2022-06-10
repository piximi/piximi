import Divider from "@mui/material/Divider";
import { useState } from "react";
import { AnnotationMode } from "../AnnotationMode";
import { InformationBox } from "../InformationBox";
import { InvertAnnotation } from "../InvertAnnotation";
import { useTranslation } from "../../../../hooks/useTranslation";
import List from "@mui/material/List";
import ListItem from "@mui/material/ListItem";
import ListItemText from "@mui/material/ListItemText";
import Slider from "@mui/material/Slider";
import { quickSelectionRegionSizeSelector } from "../../../../store/selectors/quickSelectionRegionSizeSelector";
import { imageViewerSlice } from "../../../../store/slices";
import { useDispatch, useSelector } from "react-redux";

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
