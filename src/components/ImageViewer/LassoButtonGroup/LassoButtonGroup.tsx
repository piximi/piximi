import React, { useRef, useState } from "react";
import { Image } from "../../../types/Image";
import {
  ButtonGroup,
  ClickAwayListener,
  Grow,
  MenuItem,
  MenuList,
  Paper,
  Popper,
  SvgIcon,
} from "@material-ui/core";
import { useStyles } from "./LassoButtonGroup.css";
import ArrowDropDownIcon from "@material-ui/icons/ArrowDropDown";
import Button from "@material-ui/core/Button";
import { ReactComponent as LassoIcon } from "../../../icons/Lasso.svg";
import { ReactComponent as MagneticIcon } from "../../../icons/Magnetic.svg";

type LassoButtonGroupProps = {
  data: Image;
};

export const LassoButtonGroup = ({ data }: LassoButtonGroupProps) => {
  const options = [
    <SvgIcon>
      <LassoIcon />
    </SvgIcon>,
    <SvgIcon>
      <MagneticIcon />
    </SvgIcon>,
  ];

  const classes = useStyles();

  const [openLassoMenu, setOpenLassoMenu] = useState(false);
  const lassoMenuAnchorRef = useRef<HTMLDivElement>(null);
  const [selectedIndex, setSelectedIndex] = useState(1);

  const onLassoButtonClick = () => {};

  const onLassoMenuItemClick = (
    event: React.MouseEvent<HTMLLIElement, MouseEvent>,
    index: number
  ) => {
    setSelectedIndex(index);
    setOpenLassoMenu(false);
  };

  const onLassoMenuToggle = () => {
    setOpenLassoMenu((prevOpen) => !prevOpen);
  };

  const onLassoMenuClose = (event: React.MouseEvent<Document, MouseEvent>) => {
    if (
      lassoMenuAnchorRef.current &&
      lassoMenuAnchorRef.current.contains(event.target as HTMLElement)
    ) {
      return;
    }

    setOpenLassoMenu(false);
  };

  return (
    <React.Fragment>
      <ButtonGroup
        variant="contained"
        color="primary"
        ref={lassoMenuAnchorRef}
        aria-label="split button"
      >
        <Button onClick={onLassoButtonClick}>{options[selectedIndex]}</Button>

        <Button color="primary" onClick={onLassoMenuToggle} size="small">
          <ArrowDropDownIcon />
        </Button>
      </ButtonGroup>

      <Popper
        open={openLassoMenu}
        anchorEl={lassoMenuAnchorRef.current}
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
              <ClickAwayListener onClickAway={onLassoMenuClose}>
                <MenuList>
                  <MenuItem onClick={(event) => onLassoMenuItemClick(event, 0)}>
                    {options[0]}
                  </MenuItem>

                  <MenuItem onClick={(event) => onLassoMenuItemClick(event, 1)}>
                    {options[1]}
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
