import { useState } from "react";

import {
  Collapse,
  ListItem,
  ListItemIcon,
  ListItemText,
  styled,
} from "@mui/material";
import {
  ExpandLess as ExpandLessIcon,
  ExpandMore as ExpandMoreIcon,
} from "@mui/icons-material";

import { ArchitectureSettingsGrid } from "./ArchitectureSettingsGrid/ArchitectureSettingsGrid";

export const ArchitectureSettingsListItem = () => {
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
          <ArchitectureSettingsGrid />
        </StyledForm>
      </Collapse>
    </>
  );
};
