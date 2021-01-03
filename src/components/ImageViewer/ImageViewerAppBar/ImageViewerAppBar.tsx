import React, { useRef, useState } from "react";
import { Image } from "../../../types/Image";
import {
  AppBar,
  ButtonGroup,
  ClickAwayListener,
  Grow,
  MenuItem,
  MenuList,
  Paper,
  Popper,
  SvgIcon,
  Toolbar,
} from "@material-ui/core";
import { useStyles } from "./ImageViewerAppBar.css";
import FormatColorFillIcon from "@material-ui/icons/FormatColorFill";
import ArrowDropDownIcon from "@material-ui/icons/ArrowDropDown";
import Grid from "@material-ui/core/Grid";
import Button from "@material-ui/core/Button";
import { ReactComponent as EllipticalIcon } from "../../../icons/Elliptical.svg";
import { ReactComponent as LassoIcon } from "../../../icons/Lasso.svg";
import { ReactComponent as MagneticIcon } from "../../../icons/Magnetic.svg";
import { ReactComponent as QuickIcon } from "../../../icons/Quick.svg";
import { ReactComponent as RectangularIcon } from "../../../icons/Rectangular.svg";

export const MarqueeButton = () => {
  const options = [
    <SvgIcon>
      <RectangularIcon />
    </SvgIcon>,
    <SvgIcon>
      <EllipticalIcon />
    </SvgIcon>,
  ];

  const [open, setOpen] = useState(false);
  const anchorRef = useRef<HTMLDivElement>(null);
  const [selectedIndex, setSelectedIndex] = useState(1);

  const onClick = () => {
    console.info(`You clicked ${options[selectedIndex]}`);
  };

  const onMenuItemClick = (
    event: React.MouseEvent<HTMLLIElement, MouseEvent>,
    index: number
  ) => {
    setSelectedIndex(index);
    setOpen(false);
  };

  const onToggle = () => {
    setOpen((prevOpen) => !prevOpen);
  };

  const onClose = (event: React.MouseEvent<Document, MouseEvent>) => {
    if (
      anchorRef.current &&
      anchorRef.current.contains(event.target as HTMLElement)
    ) {
      return;
    }

    setOpen(false);
  };

  return (
    <Grid container direction="column" alignItems="center">
      <Grid item xs={12}>
        <ButtonGroup
          variant="contained"
          color="primary"
          ref={anchorRef}
          aria-label="split button"
        >
          <Button onClick={onClick}>{options[selectedIndex]}</Button>

          <Button color="primary" onClick={onToggle} size="small">
            <ArrowDropDownIcon />
          </Button>
        </ButtonGroup>

        <Popper
          open={open}
          anchorEl={anchorRef.current}
          role={undefined}
          transition
          disablePortal
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
                  <MenuList id="split-button-menu">
                    {options.map((option, index) => (
                      <MenuItem
                        key={index}
                        disabled={index === 2}
                        selected={index === selectedIndex}
                        onClick={(event) => onMenuItemClick(event, index)}
                      >
                        {option}
                      </MenuItem>
                    ))}
                  </MenuList>
                </ClickAwayListener>
              </Paper>
            </Grow>
          )}
        </Popper>
      </Grid>
    </Grid>
  );
};

export enum Method {
  Elliptical,
  Lasso,
  Magnetic,
  Polygonal,
  Quick,
  Rectangular,
}

type ImageViewerAppBarProps = {
  data: Image;
};

export const ImageViewerAppBar = ({ data }: ImageViewerAppBarProps) => {
  const classes = useStyles();

  return (
    <AppBar className={classes.appBar} color="inherit" position="fixed">
      <Toolbar>
        <MarqueeButton />
      </Toolbar>
    </AppBar>
  );
};
