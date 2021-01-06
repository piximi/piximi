import React, { useState } from "react";
import { Image } from "../../../types/Image";
import { CssBaseline } from "@material-ui/core";
import { useStyles } from "./ImageViewer.css";
import AppBar from "@material-ui/core/AppBar";
import Toolbar from "@material-ui/core/Toolbar";
import Box from "@material-ui/core/Box";
import * as Konva from "react-konva";
import useImage from "use-image";
import Divider from "@material-ui/core/Divider";
import List from "@material-ui/core/List";
import ListItem from "@material-ui/core/ListItem";
import ListItemText from "@material-ui/core/ListItemText";
import ListItemIcon from "@material-ui/core/ListItemIcon";
import Radio from "@material-ui/core/Radio";
import { SelectionType } from "../../../types/SelectionType";
import SvgIcon from "@material-ui/core/SvgIcon";
import { ReactComponent as InvertSelectionIcon } from "../../../icons/InvertSelection.svg";
import Drawer from "@material-ui/core/Drawer";
import { ReactComponent as RectangularIcon } from "../../../icons/Rectangular.svg";
import { SelectionMethod } from "../../../types/SelectionMethod";
import { ReactComponent as EllipticalIcon } from "../../../icons/Elliptical.svg";
import { ReactComponent as LassoIcon } from "../../../icons/Lasso.svg";
import { ReactComponent as MagneticIcon } from "../../../icons/Magnetic.svg";
import { ReactComponent as MagicWandIcon } from "../../../icons/MagicWand.svg";
import { ReactComponent as QuickIcon } from "../../../icons/Quick.svg";
import Tooltip from "@material-ui/core/Tooltip";

const operations = [
  {
    icon: <RectangularIcon />,
    method: SelectionMethod.Rectangular,
    name: "Rectangular selection",
  },
  {
    icon: <EllipticalIcon />,
    method: SelectionMethod.Elliptical,
    name: "Elliptical selection",
  },
  {
    icon: <LassoIcon />,
    method: SelectionMethod.Lasso,
    name: "Lasso selection",
  },
  {
    icon: <MagneticIcon />,
    method: SelectionMethod.Magnetic,
    name: "Magnetic selection",
  },
  {
    icon: <MagicWandIcon />,
    method: SelectionMethod.Color,
    name: "Color selection",
  },
  {
    icon: <QuickIcon />,
    method: SelectionMethod.Quick,
    name: "Quick selection",
  },
];

type ImageViewerProps = {
  data: Image;
};

export const ImageViewer = ({ data }: ImageViewerProps) => {
  const [image] = useImage(data?.src);

  const [active, setActive] = useState<SelectionMethod>(
    SelectionMethod.Rectangular
  );

  const classes = useStyles();

  return (
    <div className={classes.root}>
      <CssBaseline />

      <AppBar className={classes.appBar} color="inherit" position="fixed">
        <Toolbar></Toolbar>
      </AppBar>

      <main className={classes.content}>
        <div className={classes.toolbar} />

        <Box alignItems="center" display="flex" justifyContent="center">
          <Konva.Stage height={data.shape?.r} width={data.shape?.c}>
            <Konva.Layer>
              <Konva.Image image={image} />
            </Konva.Layer>
          </Konva.Stage>
        </Box>
      </main>

      <Drawer
        anchor="right"
        className={classes.settings}
        classes={{ paper: classes.settingsPaper }}
        variant="permanent"
      >
        <div className={classes.settingsToolbar} />

        <Divider />

        <List>
          <ListItem dense>
            <ListItemText
              primary="Rectangular selection"
              secondary="Nam a facilisis velit, sit amet interdum ante. In sodales."
            />
          </ListItem>
        </List>

        <Divider />

        <List>
          <ListItem dense disabled>
            <ListItemIcon>
              <Radio disableRipple disabled edge="start" tabIndex={-1} />
            </ListItemIcon>

            <ListItemText
              primary={SelectionType.New}
              secondary="Create a new selection."
            />
          </ListItem>

          <ListItem dense disabled>
            <ListItemIcon>
              <Radio disableRipple disabled edge="start" tabIndex={-1} />
            </ListItemIcon>

            <ListItemText
              primary={SelectionType.Addition}
              secondary="Add area to the existing selection."
            />
          </ListItem>

          <ListItem dense disabled>
            <ListItemIcon>
              <Radio disableRipple disabled edge="start" tabIndex={-1} />
            </ListItemIcon>

            <ListItemText
              primary={SelectionType.Subtraction}
              secondary="Subtract area from the existing selection."
            />
          </ListItem>

          <ListItem dense disabled>
            <ListItemIcon>
              <Radio disableRipple disabled edge="start" tabIndex={-1} />
            </ListItemIcon>

            <ListItemText
              primary={SelectionType.Intersection}
              secondary="Constrain the boundary of the new selection to the existing selection."
            />
          </ListItem>
        </List>

        <Divider />

        <List>
          <ListItem button dense>
            <ListItemIcon>
              <SvgIcon>
                <InvertSelectionIcon />
              </SvgIcon>
            </ListItemIcon>

            <ListItemText primary="Invert selection" />
          </ListItem>
        </List>
      </Drawer>

      <Drawer
        anchor="right"
        className={classes.operations}
        classes={{ paper: classes.operationsPaper }}
        variant="permanent"
      >
        <div className={classes.operationsToolbar} />

        <Divider />

        <List>
          {operations.map((operation, index) => {
            return (
              <Tooltip
                aria-label={operation.name}
                key={index}
                title={operation.name}
              >
                <ListItem
                  button
                  onClick={() => setActive(operation.method)}
                  selected={active === operation.method}
                >
                  <ListItemIcon>
                    <SvgIcon fontSize="small">{operation.icon}</SvgIcon>
                  </ListItemIcon>
                </ListItem>
              </Tooltip>
            );
          })}
        </List>
      </Drawer>
    </div>
  );
};
