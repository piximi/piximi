import React, { useRef, useState } from "react";
import { Image } from "../../../../types/Image";
import {
  ButtonGroup,
  ClickAwayListener,
  Grow,
  ListItemIcon,
  MenuItem,
  MenuList,
  Paper,
  Popper,
  SvgIcon,
} from "@material-ui/core";
import ArrowDropDownIcon from "@material-ui/icons/ArrowDropDown";
import Button from "@material-ui/core/Button";
import { ReactComponent as RectangularIcon } from "../../../../icons/Rectangular.svg";
import { ReactComponent as EllipticalIcon } from "../../../../icons/Elliptical.svg";
import { ReactComponent as LassoIcon } from "../../../../icons/Lasso.svg";
import { ReactComponent as MagneticIcon } from "../../../../icons/Magnetic.svg";
import Typography from "@material-ui/core/Typography";

type LassoButtonGroupProps = {
  data: Image;
};

export const MarqueeButtonGroup = ({ data }: LassoButtonGroupProps) => {
  const icons = [
    <SvgIcon fontSize="small">
      <RectangularIcon />
    </SvgIcon>,
    <SvgIcon fontSize="small">
      <EllipticalIcon />
    </SvgIcon>,
  ];

  const options = [
    <ListItemIcon>
      <SvgIcon fontSize="small">
        <RectangularIcon />
      </SvgIcon>

      <Typography variant="inherit">Rectangular selection</Typography>
    </ListItemIcon>,
    <ListItemIcon>
      <SvgIcon fontSize="small">
        <EllipticalIcon />
      </SvgIcon>

      <Typography variant="inherit">Elliptical selection</Typography>
    </ListItemIcon>,
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
    <React.Fragment>
      <ButtonGroup color="inherit" ref={anchorRef} variant="contained">
        <Button onClick={onClick}>{icons[selectedIndex]}</Button>

        <Button color="inherit" onClick={onToggle} size="small">
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
    </React.Fragment>
  );
};
