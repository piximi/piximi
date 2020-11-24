import Dialog from "@material-ui/core/Dialog";
import React from "react";
import DialogContent from "@material-ui/core/DialogContent";
import Container from "@material-ui/core/Container";
import { useStyles } from "./ImageDialog.css";
import { ImageProcessingDrawer } from "../ImageProcessingDrawer";
import { ImageDialogAppBar } from "../ImageDialogAppBar";
import { ApplicationDrawer } from "../ApplicationDrawer";
import { ImageDialogCanvas } from "../ImageDialogCanvas";
import { Toolbar } from "@material-ui/core";
import { PreviousImageButton } from "../PreviousImageButton";
import { NextImageButton } from "../NextImageButton";
import { Image } from "../../types/Image";

type ImageDialogProps = {
  image: Image;
  onClose: () => void;
  open: boolean;
};

export const ImageDialog = ({ image, onClose, open }: ImageDialogProps) => {
  const classes = useStyles();

  return (
    <Dialog className={classes.dialog} fullScreen onClose={onClose} open={open}>
      <ImageDialogAppBar onClose={onClose} />

      <ApplicationDrawer />

      <DialogContent className={classes.content}>
        <Container fixed maxWidth="lg">
          <ImageDialogCanvas image={image} />

          <Toolbar style={{ justifyContent: "center" }}>
            <PreviousImageButton />

            <NextImageButton />
          </Toolbar>
        </Container>
      </DialogContent>

      <ImageProcessingDrawer />
    </Dialog>
  );
};
