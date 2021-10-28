import * as React from "react";
import { useState } from "react";
import { OptimizerSettingsGrid } from "./OptimizerSettingsGrid/OptimizerSettingsGrid";
import { createStyles, makeStyles } from "@mui/styles";
import {
  Collapse,
  ListItem,
  ListItemIcon,
  ListItemText,
  Theme,
} from "@mui/material";
import ExpandLessIcon from "@mui/icons-material/ExpandLess";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";

const useStyles = makeStyles((theme: Theme) =>
  createStyles({
    expansionPanel: {
      boxShadow: "none",
    },
    leftIcon: {
      marginRight: theme.spacing(1),
    },
    rightIcon: {
      marginLeft: theme.spacing(1),
    },
    button: {
      marginRight: theme.spacing(1),
    },
    grow: {
      flexGrow: 1,
    },
    form: {},
    appBar: {
      position: "relative",
      backgroundColor: "transparent",
      boxShadow: "none",
      borderBottom: "1px solid rgba(0, 0, 0, 0.12)",
    },
    container: {
      // width: '100%',
      display: "flex",
      flexWrap: "wrap",
    },
    root: {
      zIndex: 1100,
    },
    paper: {
      zIndex: 1100,
    },
    paperFullScreen: {
      left: "280px",
    },
    menu: {
      // width: 200,
    },
    textField: {
      // marginLeft: theme.spacing(1),
      marginRight: theme.spacing(1),
      flexBasis: 300,
      width: "100%",
    },
    title: {
      marginLeft: theme.spacing(2),
      flex: 1,
    },
    heading: {
      fontSize: theme.typography.pxToRem(15),
      fontWeight: theme.typography.fontWeightRegular,
    },
  })
);

export const OptimizerSettingsListItem = () => {
  const [collapsedClassifierSettingsList, setCollapsedClassifierSettingsList] =
    useState<boolean>(false);

  const onClasssifierSettingsListClick = () => {
    setCollapsedClassifierSettingsList(!collapsedClassifierSettingsList);
  };

  const classes = useStyles({});

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
