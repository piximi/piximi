import * as React from "react";
import { useState } from "react";
import {
  Button,
  Checkbox,
  Collapse,
  FormControlLabel,
  FormGroup,
  ListItem,
  ListItemIcon,
  ListItemText,
  Tooltip,
  Typography,
} from "@mui/material";
import ExpandLessIcon from "@mui/icons-material/ExpandLess";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import { RescalingForm } from "../RescalingForm/RescalingForm";

export const PreprocessingSettingsListItem = () => {
  const [collapsedPreprocessingList, setCollapsedPreprocessingList] =
    useState<boolean>(false);

  const onPreprocessingListClick = () => {
    // shows or hides preprocessing list in interface
    setCollapsedPreprocessingList(!collapsedPreprocessingList);
  };

  return (
    <>
      <ListItem
        button
        onClick={onPreprocessingListClick}
        style={{ padding: "12px 0px" }}
      >
        <ListItemIcon>
          {collapsedPreprocessingList ? <ExpandLessIcon /> : <ExpandMoreIcon />}
        </ListItemIcon>

        <ListItemText primary="Preprocessing" style={{ fontSize: "1em" }} />
      </ListItem>
      <Collapse in={collapsedPreprocessingList} timeout="auto" unmountOnExit>
        <Typography id="rescaling" gutterBottom>
          Pixel Intensity Rescaling
        </Typography>

        <RescalingForm />

        <Typography id="cropping" gutterBottom>
          Crop Images
        </Typography>
      </Collapse>
    </>
  );
};
