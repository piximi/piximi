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

type OptionsDrawerProps = {
  data: Image;
};

export const MethodDrawer = ({ data }: OptionsDrawerProps) => {
  const [method, setMethod] = useState<SelectionMethod>(
    SelectionMethod.Rectangular
  );

  const classes = useStyles();

  const onChange = (
    event: React.MouseEvent<HTMLElement>,
    method: SelectionMethod
  ) => {
    setMethod(method);
  };

  type MethodListItemProps = {
    icon: React.ReactNode;
    value: SelectionMethod;
    name: string;
  };

  const MethodListItem = ({ icon, value, name }: MethodListItemProps) => {
    return (
      <Tooltip aria-label={name} title={name}>
        <ListItem
          button
          onClick={(event: React.MouseEvent<HTMLElement>) =>
            onChange(event, value)
          }
          selected={method === value}
        >
          <ListItemIcon>
            <SvgIcon fontSize="small">{icon}</SvgIcon>
          </ListItemIcon>
        </ListItem>
      </Tooltip>
    );
  };

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
        <MethodListItem
          icon={<RectangularIcon />}
          value={SelectionMethod.Rectangular}
          name="Rectangular selection"
        />
        <MethodListItem
          icon={<EllipticalIcon />}
          value={SelectionMethod.Elliptical}
          name="Elliptical selection"
        />
        <MethodListItem
          icon={<LassoIcon />}
          value={SelectionMethod.Lasso}
          name="Lasso selection"
        />
        <MethodListItem
          icon={<MagneticIcon />}
          value={SelectionMethod.Magnetic}
          name="Magnetic selection"
        />
        <MethodListItem
          icon={<MagicWandIcon />}
          value={SelectionMethod.Color}
          name="Color selection"
        />
        <MethodListItem
          icon={<QuickIcon />}
          value={SelectionMethod.Quick}
          name="Quick selection"
        />
      </List>
    </Drawer>
  );
};
