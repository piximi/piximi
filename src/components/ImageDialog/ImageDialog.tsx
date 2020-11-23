import Dialog from "@material-ui/core/Dialog";
import React from "react";
import DialogContent from "@material-ui/core/DialogContent";
import Container from "@material-ui/core/Container";
import { useStyles } from "./ImageDialog.css";
import { SimpleImageCanvas } from "./SimpleImageCanvas";
import { ImageProcessingDrawer } from "../ImageProcessingDrawer";
import { ImageDialogAppBar } from "../ImageDialogAppBar";
import { ApplicationDrawer } from "../ApplicationDrawer";
import { useSelector } from "react-redux";
import { Project } from "../../types/Project";
import { Image } from "../../types/Image";

type ImageDialogProps = {
  onClose: () => void;
  open: boolean;
  imageIds: Array<string>;
};

export const ImageDialog = ({ onClose, open, imageIds }: ImageDialogProps) => {
  const id = "foo";

  const classes = useStyles();

  const nextImage: Image | null = useSelector(
    ({ project }: { project: Project }): Image | null => {
      const index = project.images.findIndex((image: Image) => id === image.id);

      if (index && index + 1 <= project.images.length) {
        return project.images[index + 1];
      }

      return null;
    }
  );

  const previousImage: Image | null = useSelector(
    ({ project }: { project: Project }): Image | null => {
      const index = project.images.findIndex((image: Image) => id === image.id);

      if (index && index - 1 >= 0) {
        return project.images[index - 1];
      }

      return null;
    }
  );

  //state of annotation type
  const [box, setBox] = React.useState<boolean>(false);
  const [brush, setBrush] = React.useState<boolean>(false);

  const onBrushClick = () => {
    setBrush(true);
    setBox(false);
  };

  const onBoxClick = () => {
    setBox(true);
    setBrush(false);
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
