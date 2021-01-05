import React, { useState } from "react";
import { Image } from "../../../types/Image";
import { Drawer, ListItem, ListItemIcon } from "@material-ui/core";
import { useStyles } from "./MethodDrawer.css";
import Divider from "@material-ui/core/Divider";
import List from "@material-ui/core/List";
import SvgIcon from "@material-ui/core/SvgIcon";
import { ReactComponent as RectangularIcon } from "../../../icons/Rectangular.svg";
import { ReactComponent as EllipticalIcon } from "../../../icons/Elliptical.svg";
import { ReactComponent as LassoIcon } from "../../../icons/Lasso.svg";
import { ReactComponent as MagneticIcon } from "../../../icons/Magnetic.svg";
import { ReactComponent as QuickIcon } from "../../../icons/Quick.svg";
import { ReactComponent as MagicWandIcon } from "../../../icons/MagicWand.svg";
import { SelectionMethod } from "../../../types/SelectionMethod";
import Tooltip from "@material-ui/core/Tooltip";

const items = [
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

type OptionsDrawerProps = {
  data: Image;
};

export const MethodDrawer = ({ data }: OptionsDrawerProps) => {
  const [selected, setSelected] = useState<SelectionMethod>(
    SelectionMethod.Rectangular
  );

  const classes = useStyles();

  return (
    <Drawer
      anchor="right"
      className={classes.drawer}
      classes={{ paper: classes.drawerPaper }}
      variant="permanent"
    >
      <div className={classes.toolbar} />

      <Divider />

      <List>
        {items.map((item, index) => {
          return (
            <Tooltip aria-label={item.name} key={index} title={item.name}>
              <ListItem
                button
                onClick={() => setSelected(item.method)}
                selected={selected === item.method}
              >
                <ListItemIcon>
                  <SvgIcon fontSize="small">{item.icon}</SvgIcon>
                </ListItemIcon>
              </ListItem>
            </Tooltip>
          );
        })}
      </List>
    </Drawer>
  );
};
