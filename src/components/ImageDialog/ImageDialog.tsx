import Dialog from "@material-ui/core/Dialog";
import React from "react";
import { TransitionProps } from "@material-ui/core/transitions";
import DialogContent from "@material-ui/core/DialogContent";
import Container from "@material-ui/core/Container";
import { useStyles } from "../Application/Application.css";
import { SimpleImageCanvas } from "./SimpleImageCanvas";
import { ApplicationDrawer } from "../ApplicationDrawer";
import { ImageProcessingDrawer } from "../ImageProcessingDrawer";
import { ImageDialogAppBar } from "../ImageDialogAppBar";

type ImageDialogProps = {
  onClose: () => void;
  open: boolean;
  imageIds: Array<string>;
  TransitionComponent?: React.ComponentType<
    TransitionProps & { children?: React.ReactElement<any, any> }
  >;
};

export const ImageDialog = ({ onClose, open, imageIds }: ImageDialogProps) => {
  const classes = useStyles();

  return (
    <Dialog fullScreen onClose={onClose} open={open}>
      <ImageDialogAppBar onClose={onClose} />

      <ApplicationDrawer />

      <DialogContent className={classes.imageDialogContent}>
        <Container fixed maxWidth="lg">
          <SimpleImageCanvas imageIds={imageIds} />
        </Container>
      </DialogContent>

      <ImageProcessingDrawer />
    </Dialog>
  );
};
