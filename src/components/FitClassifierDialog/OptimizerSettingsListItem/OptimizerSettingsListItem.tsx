import * as React from "react";
import { useState } from "react";

import { Collapse, ListItem, ListItemIcon, ListItemText } from "@mui/material";

import ExpandLessIcon from "@mui/icons-material/ExpandLess";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";

import { OptimizerSettingsGrid } from "./OptimizerSettingsGrid/OptimizerSettingsGrid";

export const OptimizerSettingsListItem = () => {
  const [collapsedClassifierSettingsList, setCollapsedClassifierSettingsList] =
    useState<boolean>(false);

  const onClasssifierSettingsListClick = () => {
    setCollapsedClassifierSettingsList(!collapsedClassifierSettingsList);
  };

  return (
    <>
      <ListItem
        button
        onClick={onClasssifierSettingsListClick}
        style={{ padding: "12px 0px" }}
      >
        <ListItemIcon>
          {collapsedClassifierSettingsList ? (
            <ExpandLessIcon />
          ) : (
            <ExpandMoreIcon />
          )}
        </ListItemIcon>

        <ListItemText
          primary="Optimization Settings"
          style={{ fontSize: "20px" }}
        />
      </ListItem>
      <Collapse
        in={collapsedClassifierSettingsList}
        timeout="auto"
        unmountOnExit
      >
        <OptimizerSettingsGrid />
      </Collapse>
    </>
  );
};
