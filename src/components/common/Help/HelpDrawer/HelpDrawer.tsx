import React from "react";

import { IconButton } from "@mui/material";
import Drawer from "@mui/material/Drawer";
import ListItem from "@mui/material/ListItem";
import ListItemIcon from "@mui/material/ListItemIcon";
import HelpIcon from "@mui/icons-material/Help";
import CloseIcon from "@mui/icons-material/Close";
import ListItemText from "@mui/material/ListItemText";

import { HelpContent, HelpTopic } from "../HelpContent/HelpContent";

import { AppBarOffset } from "components/styled/AppBarOffset";

type HelpDrawerProps = {
  helpContent: Array<HelpTopic>;
  appBarOffset?: boolean;
};

export default function HelpDrawer({
  helpContent,
  appBarOffset = false,
}: HelpDrawerProps) {
  const [state, setState] = React.useState({
    top: false,
    left: false,
    bottom: false,
    right: false,
  });

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

  const HelpContentComponent = HelpContent(helpContent);

  return (
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
        {appBarOffset && <AppBarOffset />}

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
  );
}

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
