import * as React from "react";
import { useState } from "react";
import { SegmenterArchitectureSettingsGrid } from "./ArchitectureSettingsGrid/SegmenterArchitectureSettingsGrid";
import {
  Collapse,
  ListItem,
  ListItemIcon,
  ListItemText,
  styled,
} from "@mui/material";
import ExpandLessIcon from "@mui/icons-material/ExpandLess";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";

export const SegmenterArchitectureSettingsListItem = () => {
  const [collapsedClassifierSettingsList, setCollapsedClassifierSettingsList] =
    useState<boolean>(false);

  const onClasssifierSettingsListClick = () => {
    setCollapsedClassifierSettingsList(!collapsedClassifierSettingsList);
  };

  const StyledForm = styled("form")({
    // width: '100%',
    display: "flex",
    flexWrap: "wrap",
  });

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
          primary="Architecture Settings"
          style={{ fontSize: "20px" }}
        />
      </ListItem>
      <Collapse
        in={collapsedClassifierSettingsList}
        timeout="auto"
        unmountOnExit
      >
        <StyledForm noValidate autoComplete="off">
          <SegmenterArchitectureSettingsGrid />
        </StyledForm>
      </Collapse>
    </>
  );
};
