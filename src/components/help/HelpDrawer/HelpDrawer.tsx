import React from "react";
import { useDispatch } from "react-redux";
import { ErrorBoundary } from "react-error-boundary";
import { useLocation } from "react-router-dom";

import {
  Drawer,
  IconButton,
  ListItem,
  ListItemIcon,
  ListItemText,
} from "@mui/material";
import { Help as HelpIcon, Close as CloseIcon } from "@mui/icons-material";

import { AppBarOffset } from "../../common/styled-components/AppBarOffset";
import { HelpContent, HelpContentType } from "./HelpContent/HelpContent";

import { applicationSlice } from "store/application";

import { AlertType } from "types";

export const HelpDrawer = () => {
  const dispatch = useDispatch();
  const [state, setState] = React.useState({
    top: false,
    left: false,
    bottom: false,
    right: false,
  });
  const location = useLocation();
  const helpContent: HelpContentType =
    location.pathname === "/annotator"
      ? require("./HelpContent/AnnotatorHelpContent.json")
      : require("./HelpContent/ClassifierHelpContent.json");

  const handleError = (error: Error, info: { componentStack: string }) => {
    dispatch(
      applicationSlice.actions.updateAlertState({
        alertState: {
          alertType: AlertType.Error,
          name: helpContent.error,
          description: error.name + ": " + error.message,
          stackTrace: info.componentStack,
        },
      })
    );
  };

  const toggleDrawer =
    (anchor: string, open: boolean) =>
    (event: React.KeyboardEvent | React.MouseEvent) => {
      if (
        event.type === "keydown" &&
        ((event as React.KeyboardEvent).key === "Tab" ||
          (event as React.KeyboardEvent).key === "Shift")
      ) {
        return;
      }

      setState({ ...state, [anchor]: open });
    };

  const HelpContentComponent = HelpContent(helpContent.topics);

  return (
    <ErrorBoundary onError={handleError} FallbackComponent={FallBackHelpDrawer}>
      <div key={"left"}>
        <ListItem button onClick={toggleDrawer("left", true)}>
          <ListItemIcon>
            <HelpIcon />
          </ListItemIcon>

          <ListItemText primary="Help" />
        </ListItem>

        <Drawer
          variant={"persistent"}
          anchor={"left"}
          sx={(theme) => ({
            width: theme.spacing(32),
            flexShrink: 0,
            "& > .MuiDrawer-paper": {
              width: theme.spacing(32),
            },
          })}
          open={state["left"]}
          onClose={toggleDrawer("left", false)}
        >
          {helpContent.appBarOffset && <AppBarOffset />}

          <div tabIndex={1} role="button">
            <IconButton
              style={{ float: "right", marginRight: "20px" }}
              onClick={toggleDrawer("left", false)}
            >
              <CloseIcon />
            </IconButton>
          </div>

          {HelpContentComponent}
        </Drawer>
      </div>
    </ErrorBoundary>
  );
};

export const FallBackHelpDrawer = () => {
  return (
    <ListItem disabled>
      <ListItemIcon>
        <HelpIcon />
      </ListItemIcon>

      <ListItemText primary="Help" />
    </ListItem>
  );
};
