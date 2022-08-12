import * as React from "react";
import { useState } from "react";

import { Collapse, ListItem, ListItemIcon, ListItemText } from "@mui/material";

import {
  ExpandLess as ExpandLessIcon,
  ExpandMore as ExpandMoreIcon,
} from "@mui/icons-material";

import { RescalingForm } from "./RescalingForm";
import { CroppingForm } from "./CroppingForm";

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
        <RescalingForm />
        <CroppingForm />
      </Collapse>
    </>
  );
};
