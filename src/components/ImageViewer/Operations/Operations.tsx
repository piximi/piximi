import Divider from "@material-ui/core/Divider";
import Drawer from "@material-ui/core/Drawer";
import List from "@material-ui/core/List";
import ListItem from "@material-ui/core/ListItem";
import ListItemIcon from "@material-ui/core/ListItemIcon";
import React from "react";
import SvgIcon from "@material-ui/core/SvgIcon";
import Tooltip from "@material-ui/core/Tooltip";
import { ReactComponent as ColorAdjustmentIcon } from "../../../icons/ColorAdjustment.svg";
import { ReactComponent as EllipticalIcon } from "../../../icons/Elliptical.svg";
import { ReactComponent as LassoIcon } from "../../../icons/Lasso.svg";
import { ReactComponent as MagicWandIcon } from "../../../icons/MagicWand.svg";
import { ReactComponent as ZoomIcon } from "../../../icons/Zoom.svg";
import { ReactComponent as HandIcon } from "../../../icons/Hand.svg";
import { ReactComponent as MagneticIcon } from "../../../icons/Magnetic.svg";
import { ReactComponent as QuickIcon } from "../../../icons/Quick.svg";
import { ReactComponent as ObjectSelectionIcon } from "../../../icons/ObjectSelection.svg";
import { ReactComponent as RectangularIcon } from "../../../icons/Rectangular.svg";
import { ImageViewerOperation } from "../../../types/ImageViewerOperation";
import { useStyles } from "./Operations.css";
import { SelectionOptions } from "../SelectionOptions";
import { PolygonalSelection } from "../PolygonalSelection/PolygonalSelection";

type ImageViewerProps = {
  activeOperation: ImageViewerOperation;
  setActiveOperation: (operation: ImageViewerOperation) => void;
};

export const Operations = ({
  activeOperation,
  setActiveOperation,
}: ImageViewerProps) => {
  const operations = [
    {
      description: "Nam a facilisis velit, sit amet interdum ante. In sodales.",
      icon: <ColorAdjustmentIcon />,
      method: ImageViewerOperation.ColorAdjustment,
      name: "Color adjustment",
      settings: <React.Fragment />,
    },
    {
      description: "Nam a facilisis velit, sit amet interdum ante. In sodales.",
      icon: <RectangularIcon />,
      method: ImageViewerOperation.RectangularSelection,
      name: "Rectangular selection",
      settings: <SelectionOptions />,
    },
    {
      description: "Nam a facilisis velit, sit amet interdum ante. In sodales.",
      icon: <EllipticalIcon />,
      method: ImageViewerOperation.EllipticalSelection,
      name: "Elliptical selection",
      settings: <SelectionOptions />,
    },
    {
      description: "Nam a facilisis velit, sit amet interdum ante. In sodales.",
      icon: <EllipticalIcon />,
      method: ImageViewerOperation.PolygonalSelection,
      name: "Polygonal selection",
      settings: <SelectionOptions />,
    },
    {
      description: "Nam a facilisis velit, sit amet interdum ante. In sodales.",
      icon: <LassoIcon />,
      method: ImageViewerOperation.LassoSelection,
      name: "Lasso selection",
      settings: <SelectionOptions />,
    },
    {
      description: "Nam a facilisis velit, sit amet interdum ante. In sodales.",
      icon: <MagneticIcon />,
      method: ImageViewerOperation.MagneticSelection,
      name: "Magnetic selection",
      settings: <SelectionOptions />,
    },
    {
      description: "Nam a facilisis velit, sit amet interdum ante. In sodales.",
      icon: <MagicWandIcon />,
      method: ImageViewerOperation.ColorSelection,
      name: "Color selection",
      settings: <SelectionOptions />,
    },
    {
      description: "Nam a facilisis velit, sit amet interdum ante. In sodales.",
      icon: <QuickIcon />,
      method: ImageViewerOperation.QuickSelection,
      name: "Quick selection",
      settings: <SelectionOptions />,
    },
    {
      description: "Nam a facilisis velit, sit amet interdum ante. In sodales.",
      icon: <ObjectSelectionIcon />,
      method: ImageViewerOperation.ObjectSelection,
      name: "Object selection",
      settings: <SelectionOptions />,
    },
    {
      description: "Nam a facilisis velit, sit amet interdum ante. In sodales.",
      icon: <HandIcon />,
      method: ImageViewerOperation.Hand,
      name: "Hand",
      settings: <React.Fragment />,
    },
    {
      description: "Nam a facilisis velit, sit amet interdum ante. In sodales.",
      icon: <ZoomIcon />,
      method: ImageViewerOperation.Zoom,
      name: "Zoom",
      settings: <React.Fragment />,
    },
  ];

  const classes = useStyles();

  return (
    <Drawer
      anchor="right"
      className={classes.drawer}
      classes={{ paper: classes.paper }}
      variant="permanent"
    >
      <div className={classes.toolbar} />

      <Divider />

      <List>
        <Tooltip aria-label="color adjustment" title="Color adjustment">
          <ListItem
            button
            onClick={() =>
              setActiveOperation(ImageViewerOperation.ColorAdjustment)
            }
            selected={activeOperation === ImageViewerOperation.ColorAdjustment}
          >
            <ListItemIcon>
              <SvgIcon fontSize="small">
                <ColorAdjustmentIcon />
              </SvgIcon>
            </ListItemIcon>
          </ListItem>
        </Tooltip>

        <Divider />

        <Tooltip
          aria-label="rectangular selection"
          title="Rectangular selection"
        >
          <ListItem
            button
            onClick={() =>
              setActiveOperation(ImageViewerOperation.RectangularSelection)
            }
            selected={
              activeOperation === ImageViewerOperation.RectangularSelection
            }
          >
            <ListItemIcon>
              <SvgIcon fontSize="small">
                <RectangularIcon />
              </SvgIcon>
            </ListItemIcon>
          </ListItem>
        </Tooltip>

        <Tooltip aria-label="elliptical selection" title="Elliptical selection">
          <ListItem
            button
            onClick={() =>
              setActiveOperation(ImageViewerOperation.EllipticalSelection)
            }
            selected={
              activeOperation === ImageViewerOperation.EllipticalSelection
            }
          >
            <ListItemIcon>
              <SvgIcon fontSize="small">
                <EllipticalIcon />
              </SvgIcon>
            </ListItemIcon>
          </ListItem>
        </Tooltip>

        <Tooltip aria-label="lasso selection" title="Lasso selection">
          <ListItem
            button
            onClick={() =>
              setActiveOperation(ImageViewerOperation.LassoSelection)
            }
            selected={activeOperation === ImageViewerOperation.LassoSelection}
          >
            <ListItemIcon>
              <SvgIcon fontSize="small">
                <LassoIcon />
              </SvgIcon>
            </ListItemIcon>
          </ListItem>
        </Tooltip>

        <Tooltip aria-label="polygonal selection" title="Polygonal selection">
          <ListItem
            button
            onClick={() =>
              setActiveOperation(ImageViewerOperation.PolygonalSelection)
            }
            selected={
              activeOperation === ImageViewerOperation.PolygonalSelection
            }
          >
            <ListItemIcon>
              <SvgIcon fontSize="small">
                <EllipticalIcon />
              </SvgIcon>
            </ListItemIcon>
          </ListItem>
        </Tooltip>

        <Tooltip aria-label="magnetic selection" title="Magnetic selection">
          <ListItem
            button
            onClick={() =>
              setActiveOperation(ImageViewerOperation.MagneticSelection)
            }
            selected={
              activeOperation === ImageViewerOperation.MagneticSelection
            }
          >
            <ListItemIcon>
              <SvgIcon fontSize="small">
                <MagneticIcon />
              </SvgIcon>
            </ListItemIcon>
          </ListItem>
        </Tooltip>

        <Tooltip aria-label="color selection" title="Color selection">
          <ListItem
            button
            onClick={() =>
              setActiveOperation(ImageViewerOperation.ColorSelection)
            }
            selected={activeOperation === ImageViewerOperation.ColorSelection}
          >
            <ListItemIcon>
              <SvgIcon fontSize="small">
                <RectangularIcon />
              </SvgIcon>
            </ListItemIcon>
          </ListItem>
        </Tooltip>

        <Tooltip aria-label="quick selection" title="Quick selection">
          <ListItem
            button
            onClick={() =>
              setActiveOperation(ImageViewerOperation.QuickSelection)
            }
            selected={activeOperation === ImageViewerOperation.QuickSelection}
          >
            <ListItemIcon>
              <SvgIcon fontSize="small">
                <QuickIcon />
              </SvgIcon>
            </ListItemIcon>
          </ListItem>
        </Tooltip>

        <Tooltip aria-label="object selection" title="Object selection">
          <ListItem
            button
            onClick={() =>
              setActiveOperation(ImageViewerOperation.ObjectSelection)
            }
            selected={activeOperation === ImageViewerOperation.ObjectSelection}
          >
            <ListItemIcon>
              <SvgIcon fontSize="small">
                <ObjectSelectionIcon />
              </SvgIcon>
            </ListItemIcon>
          </ListItem>
        </Tooltip>

        <Divider />

        <Tooltip aria-label="zoom" title="Zoom">
          <ListItem
            button
            onClick={() => setActiveOperation(ImageViewerOperation.Zoom)}
            selected={activeOperation === ImageViewerOperation.Zoom}
          >
            <ListItemIcon>
              <SvgIcon fontSize="small">
                <ZoomIcon />
              </SvgIcon>
            </ListItemIcon>
          </ListItem>
        </Tooltip>

        <Tooltip aria-label="hand" title="Hand">
          <ListItem
            button
            onClick={() => setActiveOperation(ImageViewerOperation.Hand)}
            selected={activeOperation === ImageViewerOperation.Hand}
          >
            <ListItemIcon>
              <SvgIcon fontSize="small">
                <HandIcon />
              </SvgIcon>
            </ListItemIcon>
          </ListItem>
        </Tooltip>
      </List>
    </Drawer>
  );
};
