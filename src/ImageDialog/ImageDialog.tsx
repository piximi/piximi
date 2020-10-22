import Dialog from "@material-ui/core/Dialog";
import React from "react";
import { Image } from "../store";
import { TransitionProps } from "@material-ui/core/transitions";
import { CategoriesDrawer } from "./CategoriesDrawer";
import { ImageProcessingDrawer } from "./ImageProcessingDrawer";
import DialogContent from "@material-ui/core/DialogContent";
import Container from "@material-ui/core/Container";
import { useStyles } from "../index.css";
import AppBar from "@material-ui/core/AppBar";
import Toolbar from "@material-ui/core/Toolbar";
import IconButton from "@material-ui/core/IconButton";
import CloseIcon from "@material-ui/icons/Close";

type ImageDialogProps = {
  onClose: () => void;
  open: boolean;
  image: Image;
  TransitionComponent?: React.ComponentType<
    TransitionProps & { children?: React.ReactElement<any, any> }
  >;
};

export const ImageDialog = ({
  onClose,
  open,
  image,
  TransitionComponent,
}: ImageDialogProps) => {
  const classes = useStyles();

  return (
    <Dialog
      fullScreen
      onClose={onClose}
      open={open}
      TransitionComponent={TransitionComponent}
    >
      <AppBar className={classes.imageDialogAppBar} position="fixed">
        <Toolbar>
          <IconButton edge="start" color="inherit" onClick={onClose}>
            <CloseIcon />
          </IconButton>
        </Toolbar>
      </AppBar>

      <CategoriesDrawer />

      <DialogContent className={classes.imageDialogContent}>
        <Container fixed maxWidth="sm">
          <div />
        </Container>
      </DialogContent>

      <ImageProcessingDrawer />
    </Dialog>
  );
};
