import React from "react";
import Dialog from "@material-ui/core/Dialog";
import AppBar from "@material-ui/core/AppBar";
import Toolbar from "@material-ui/core/Toolbar";
import IconButton from "@material-ui/core/IconButton";
import CloseIcon from "@material-ui/icons/Close";
import { TransitionProps } from "@material-ui/core/transitions";
import Slide from "@material-ui/core/Slide";
import { useStyles } from "./index.css";
import Container from "@material-ui/core/Container";
import DialogContent from "@material-ui/core/DialogContent";

type ClassifierSettingsDialogProps = {
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

export const ClassifierSettingsDialog = ({
  onClose,
  open,
}: ClassifierSettingsDialogProps) => {
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

      <DialogContent>
        <Container className={classes.container} maxWidth="md">
          foo
        </Container>
      </DialogContent>
    </Dialog>
  );
};
