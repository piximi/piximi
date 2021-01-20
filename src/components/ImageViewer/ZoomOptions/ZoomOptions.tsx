import Radio from "@material-ui/core/Radio";
import React from "react";
import { RadioGroup } from "@material-ui/core";
import FormControlLabel from "@material-ui/core/FormControlLabel";
import List from "@material-ui/core/List";
import ListItem from "@material-ui/core/ListItem";
import ListItemText from "@material-ui/core/ListItemText";
import Button from "@material-ui/core/Button";
import { useDispatch, useSelector } from "react-redux";
import { imageViewerZoomModeSelector } from "../../../store/selectors/imageViewerZoomModeSelector";
import { ImageViewerZoomMode } from "../../../types/ImageViewerZoomMode";
import { imageViewerSlice } from "../../../store/slices";

type ZoomOptionsProps = {
  handleModeChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
  handleRevert: () => void;
};

export const ZoomOptions = ({ handleRevert }: ZoomOptionsProps) => {
  const dispatch = useDispatch();

  const zoomMode = useSelector(imageViewerZoomModeSelector);

  const onChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt((event.target as HTMLInputElement).value);

    dispatch(
      imageViewerSlice.actions.setImageViewerZoomMode({
        zoomMode: value as ImageViewerZoomMode,
      })
    );
  };

  return (
    <List>
      <ListItem dense>
        <ListItemText primary={"Mode"} secondary={"Select the zoom mode."} />

        <RadioGroup
          defaultValue={ImageViewerZoomMode.In}
          name="zoom-mode"
          onChange={onChange}
          value={zoomMode}
        >
          <FormControlLabel
            control={<Radio tabIndex={-1} />}
            label="Zoom In"
            value={ImageViewerZoomMode.In}
          />

          <FormControlLabel
            control={<Radio tabIndex={-1} />}
            label="Zoom out"
            value={ImageViewerZoomMode.Out}
          />
        </RadioGroup>
      </ListItem>

      <ListItem>
        <Button onClick={handleRevert} variant="contained">
          Actual Size
        </Button>
      </ListItem>
    </List>
  );
};
