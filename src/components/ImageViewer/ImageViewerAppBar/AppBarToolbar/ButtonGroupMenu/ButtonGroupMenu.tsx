import ClickAwayListener from "@material-ui/core/ClickAwayListener";
import Grow from "@material-ui/core/Grow";
import MenuList from "@material-ui/core/MenuList";
import Paper from "@material-ui/core/Paper";
import Popper from "@material-ui/core/Popper";
import React from "react";

type ButtonGroupPopperProps = {
  anchorEl: any;
  children: React.ReactNode;
  onClose: (event: React.MouseEvent<Document, MouseEvent>) => void;
  open: boolean;
};

export const ButtonGroupMenu = ({
  anchorEl,
  children,
  onClose,
  open,
}: ButtonGroupPopperProps) => {
  return (
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
              <MenuList dense>{children}</MenuList>
            </ClickAwayListener>
          </Paper>
        </Grow>
      )}
    </Popper>
  );
};
