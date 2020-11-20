import Dialog from "@material-ui/core/Dialog";
import React from "react";
import { TransitionProps } from "@material-ui/core/transitions";
import DialogContent from "@material-ui/core/DialogContent";
import Container from "@material-ui/core/Container";
import { useStyles } from "./ImageDialog.css";
import { SimpleImageCanvas } from "./SimpleImageCanvas";
import { ImageProcessingDrawer } from "../ImageProcessingDrawer";
import { ImageDialogAppBar } from "../ImageDialogAppBar";
import { ApplicationDrawer } from "../ApplicationDrawer";

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

  //state of annotation type
  const [box, setBox] = React.useState<boolean>(false);
  const [brush, setBrush] = React.useState<boolean>(false);

  const onBrushClick = () => {
    setBrush(true);
  };

  const onBoxClick = () => {
    setBox(true);
  };

  return (
    <Dialog className={classes.dialog} fullScreen onClose={onClose} open={open}>
      <ImageDialogAppBar
        onClose={onClose}
        onBrushClick={onBrushClick}
        onBoxClick={onBoxClick}
      />

      <ApplicationDrawer />

      <DialogContent className={classes.content}>
        <Container fixed maxWidth="lg">
          <SimpleImageCanvas imageIds={imageIds} box={box} brush={brush} />
        </Container>
      </DialogContent>

      <ImageProcessingDrawer />
    </Dialog>
  );
};
