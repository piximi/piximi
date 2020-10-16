import React from "react";
import Dialog from "@material-ui/core/Dialog";
import AppBar from "@material-ui/core/AppBar";
import Toolbar from "@material-ui/core/Toolbar";
import IconButton from "@material-ui/core/IconButton";
import CloseIcon from "@material-ui/icons/Close";
import { TransitionProps } from "@material-ui/core/transitions";
import Slide from "@material-ui/core/Slide";
import { useStyles } from "./index.css";

type SettingsDialogProps = {
  onClose: () => void;
  open: boolean;
};

const DialogTransition = React.forwardRef(
  (
    props: TransitionProps & { children?: React.ReactElement },
    ref: React.Ref<unknown>
  ) => {
    return <Slide direction="right" ref={ref} {...props} />;
  }
);

export const SettingsDialog = ({ onClose, open }: SettingsDialogProps) => {
  const classes = useStyles();

  return (
    <Dialog
      fullScreen
      onClose={onClose}
      open={open}
      TransitionComponent={DialogTransition}
    >
      <AppBar className={classes.settingsDialogAppBar}>
        <Toolbar>
          <IconButton edge="start" color="inherit" onClick={onClose}>
            <CloseIcon />
          </IconButton>
        </Toolbar>
      </AppBar>
    </Dialog>
  );
};
