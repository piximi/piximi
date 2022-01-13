import React from "react";
import Drawer from "@mui/material/Drawer";
import CloseIcon from "@mui/icons-material/Close";

import { CollapsibleHelpContent } from "./CollapsibleHelpContent";
import { IconButton } from "@mui/material";
import {
  ChangingAnnotationsHelpContent,
  CreatingCategoriesContent,
  MakingNewAnnotationsHelpContent,
  ManipulatingCanvasContent,
  OpeningImagesHelpContent,
  SavingProjectHelpContent,
} from "../HelpContent/HelpContent";
import Container from "@mui/material/Container";
import ListItem from "@mui/material/ListItem";
import ListItemIcon from "@mui/material/ListItemIcon";
import HelpIcon from "@mui/icons-material/Help";
import ListItemText from "@mui/material/ListItemText";

export default function HelpDrawer() {
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
          width: theme.spacing(35),
          flexShrink: 0,
          "& > .MuiDrawer-paper": {
            width: theme.spacing(35),
          },
        })}
        open={state["left"]}
        onClose={toggleDrawer("left", false)}
      >
        <div tabIndex={1} role="button">
          <IconButton
            style={{ float: "right", marginRight: "20px" }}
            onClick={toggleDrawer("left", false)}
          >
            <CloseIcon />
          </IconButton>
        </div>
        <CollapsibleHelpContent
          primary={"Opening images"}
          closed={false}
          dense={true}
        >
          <Container>
            <OpeningImagesHelpContent />
          </Container>
        </CollapsibleHelpContent>
        <CollapsibleHelpContent
          primary={"Manipulating the canvas"}
          closed={false}
          dense={true}
        >
          <Container>
            <ManipulatingCanvasContent />
          </Container>
        </CollapsibleHelpContent>
        <CollapsibleHelpContent
          primary={"Creating categories"}
          closed={false}
          dense={true}
        >
          <Container>
            <CreatingCategoriesContent />
          </Container>
        </CollapsibleHelpContent>
        <CollapsibleHelpContent
          primary={"Making new annotations"}
          closed={false}
          dense={true}
        >
          <Container>
            <MakingNewAnnotationsHelpContent />
          </Container>
        </CollapsibleHelpContent>
        <CollapsibleHelpContent
          primary={"Changing existing annotations"}
          closed={false}
          dense={true}
        >
          <Container>
            <ChangingAnnotationsHelpContent />
          </Container>
        </CollapsibleHelpContent>
        <CollapsibleHelpContent
          primary={"Saving project and exporting annotations"}
          closed={false}
          dense={true}
        >
          <Container>
            <SavingProjectHelpContent />
          </Container>
        </CollapsibleHelpContent>
      </Drawer>
    </div>
  );
}
