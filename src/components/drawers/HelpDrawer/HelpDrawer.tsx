import React from "react";
import { useDispatch } from "react-redux";
import { ErrorBoundary } from "react-error-boundary";
import { useLocation } from "react-router-dom";

import { Drawer, IconButton } from "@mui/material";
import { Help as HelpIcon, Close as CloseIcon } from "@mui/icons-material";

import { AppBarOffset } from "../../styled-components/AppBarOffset/AppBarOffset";
import { HelpContent, HelpContentType } from "./HelpContent/HelpContent";

import { applicationSlice } from "store/application";

import { AlertType } from "types";
import { CustomListItemButton } from "components/list-items/CustomListItemButton";
import { CustomListItem } from "components/list-items/CustomListItem";

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
        <CustomListItemButton
          primaryText="Help"
          onClick={toggleDrawer("left", true)}
          icon={<HelpIcon />}
        />

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
  return <CustomListItem primaryText="Help" icon={<HelpIcon />} />;
};
