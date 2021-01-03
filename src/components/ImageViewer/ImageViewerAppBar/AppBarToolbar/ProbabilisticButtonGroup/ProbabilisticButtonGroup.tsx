import ArrowDropDownIcon from "@material-ui/icons/ArrowDropDown";
import Button from "@material-ui/core/Button";
import ButtonGroup from "@material-ui/core/ButtonGroup";
import ClickAwayListener from "@material-ui/core/ClickAwayListener";
import Grow from "@material-ui/core/Grow";
import ListItem from "@material-ui/core/ListItem";
import ListItemIcon from "@material-ui/core/ListItemIcon";
import ListItemText from "@material-ui/core/ListItemText";
import MenuItem from "@material-ui/core/MenuItem";
import MenuList from "@material-ui/core/MenuList";
import Paper from "@material-ui/core/Paper";
import Popper from "@material-ui/core/Popper";
import React, { useRef, useState } from "react";
import SvgIcon from "@material-ui/core/SvgIcon";
import { Image } from "../../../../../types/Image";
import { ReactComponent as MagicWandIcon } from "../../../../../icons/MagicWand.svg";
import { ReactComponent as QuickIcon } from "../../../../../icons/Quick.svg";
import { useStyles } from "./ProbabilisticButtonGroup.css";
import { SelectionMethod } from "../../../../../types/SelectionMethod";

type ProbabilisticButtonGroupProps = {
  data: Image;
};

export const ProbabilisticButtonGroup = ({
  data,
}: ProbabilisticButtonGroupProps) => {
  const anchorEl = useRef<HTMLDivElement>(null);

  const [visible, setVisible] = useState<SelectionMethod>(
    SelectionMethod.Quick
  );

  const [open, setOpen] = useState<boolean>(false);

  const classes = useStyles();

  const onClick = (
    event: React.MouseEvent<HTMLLIElement, MouseEvent>,
    method: SelectionMethod
  ) => {
    setVisible(method);
    setOpen(false);
  };

  const onClose = (event: React.MouseEvent<Document, MouseEvent>) => {
    if (
      anchorEl.current &&
      anchorEl.current.contains(event.target as HTMLElement)
    ) {
      return;
    }

    setOpen(false);
  };

  const onOpen = () => {
    setOpen(true);
  };

  const MethodIcon = () => {
    switch (visible) {
      case SelectionMethod.Color:
        return <MagicWandIcon />;
      case SelectionMethod.Object:
        return <MagicWandIcon />;
      default:
        return <QuickIcon />;
    }
  };

  return (
    <React.Fragment>
      <ButtonGroup color="inherit" ref={anchorEl} variant="contained">
        <Button>
          <SvgIcon fontSize="small">
            <MethodIcon />
          </SvgIcon>
        </Button>

        <Button color="inherit" onClick={onOpen} size="small">
          <ArrowDropDownIcon />
        </Button>
      </ButtonGroup>

      <Popper
        anchorEl={anchorEl.current}
        disablePortal
        open={open}
        role={undefined}
        transition
      >
        {({ TransitionProps, placement }) => (
          <Grow
            {...TransitionProps}
            style={{
              transformOrigin:
                placement === "bottom" ? "center top" : "center bottom",
            }}
          >
            <Paper>
              <ClickAwayListener onClickAway={onClose}>
                <MenuList dense>
                  <MenuItem
                    onClick={(
                      event: React.MouseEvent<HTMLLIElement, MouseEvent>
                    ) => {
                      onClick(event, SelectionMethod.Color);
                    }}
                  >
                    <ListItem dense>
                      <ListItemIcon className={classes.icon}>
                        <SvgIcon fontSize="small">
                          <MagicWandIcon />
                        </SvgIcon>
                      </ListItemIcon>

                      <ListItemText
                        className={classes.text}
                        primary="Color selection"
                      />
                    </ListItem>
                  </MenuItem>

                  <MenuItem
                    onClick={(
                      event: React.MouseEvent<HTMLLIElement, MouseEvent>
                    ) => {
                      onClick(event, SelectionMethod.Object);
                    }}
                  >
                    <ListItem dense>
                      <ListItemIcon className={classes.icon}>
                        <SvgIcon fontSize="small">
                          <MagicWandIcon />
                        </SvgIcon>
                      </ListItemIcon>

                      <ListItemText
                        className={classes.text}
                        primary="Object selection"
                      />
                    </ListItem>
                  </MenuItem>

                  <MenuItem
                    onClick={(
                      event: React.MouseEvent<HTMLLIElement, MouseEvent>
                    ) => {
                      onClick(event, SelectionMethod.Quick);
                    }}
                  >
                    <ListItem dense>
                      <ListItemIcon className={classes.icon}>
                        <SvgIcon fontSize="small">
                          <QuickIcon />
                        </SvgIcon>
                      </ListItemIcon>

                      <ListItemText
                        className={classes.text}
                        primary="Quick selection"
                      />
                    </ListItem>
                  </MenuItem>
                </MenuList>
              </ClickAwayListener>
            </Paper>
          </Grow>
        )}
      </Popper>
    </React.Fragment>
  );
};
