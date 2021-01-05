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
import { ReactComponent as MagicWandIcon } from "../../../icons/MagicWand.svg";
import { ReactComponent as QuickIcon } from "../../../icons/Quick.svg";
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
        <Tooltip
          aria-label="rectangular selection"
          title="Rectangular selection"
        >
          <ListItem
            button
            onClick={(event: React.MouseEvent<HTMLElement>) =>
              onChange(event, SelectionMethod.Rectangular)
            }
            selected={method === SelectionMethod.Rectangular}
          >
            <ListItemIcon>
              <SvgIcon fontSize="small">
                <RectangularIcon />
              </SvgIcon>
            </ListItemIcon>
          </ListItem>
        </Tooltip>

        <Tooltip
          aria-label="rectangular selection"
          title="Rectangular selection"
        >
          <ListItem
            button
            onClick={(event: React.MouseEvent<HTMLElement>) =>
              onChange(event, SelectionMethod.Elliptical)
            }
            selected={method === SelectionMethod.Elliptical}
          >
            <ListItemIcon>
              <SvgIcon fontSize="small">
                <EllipticalIcon />
              </SvgIcon>
            </ListItemIcon>
          </ListItem>
        </Tooltip>

        <Tooltip
          aria-label="rectangular selection"
          title="Rectangular selection"
        >
          <ListItem
            button
            onClick={(event: React.MouseEvent<HTMLElement>) =>
              onChange(event, SelectionMethod.Lasso)
            }
            selected={method === SelectionMethod.Lasso}
          >
            <ListItemIcon>
              <SvgIcon fontSize="small">
                <LassoIcon />
              </SvgIcon>
            </ListItemIcon>
          </ListItem>
        </Tooltip>

        <Tooltip
          aria-label="rectangular selection"
          title="Rectangular selection"
        >
          <ListItem
            button
            onClick={(event: React.MouseEvent<HTMLElement>) =>
              onChange(event, SelectionMethod.Magnetic)
            }
            selected={method === SelectionMethod.Magnetic}
          >
            <ListItemIcon>
              <SvgIcon fontSize="small">
                <MagneticIcon />
              </SvgIcon>
            </ListItemIcon>
          </ListItem>
        </Tooltip>

        <Tooltip
          aria-label="rectangular selection"
          title="Rectangular selection"
        >
          <ListItem
            button
            onClick={(event: React.MouseEvent<HTMLElement>) =>
              onChange(event, SelectionMethod.Color)
            }
            selected={method === SelectionMethod.Color}
          >
            <ListItemIcon>
              <SvgIcon fontSize="small">
                <MagicWandIcon />
              </SvgIcon>
            </ListItemIcon>
          </ListItem>
        </Tooltip>

        <Tooltip
          aria-label="rectangular selection"
          title="Rectangular selection"
        >
          <ListItem
            button
            onClick={(event: React.MouseEvent<HTMLElement>) =>
              onChange(event, SelectionMethod.Quick)
            }
            selected={method === SelectionMethod.Quick}
          >
            <ListItemIcon>
              <SvgIcon fontSize="small">
                <QuickIcon />
              </SvgIcon>
            </ListItemIcon>
          </ListItem>
        </Tooltip>
      </List>
    </Drawer>
  );
};
