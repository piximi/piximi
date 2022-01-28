import * as React from "react";
import List from "@mui/material/List";
import ListItem from "@mui/material/ListItem";
import ListItemText from "@mui/material/ListItemText";
import DialogTitle from "@mui/material/DialogTitle";
import Dialog from "@mui/material/Dialog";
import { DimensionOrder } from "../../../../types/DimensionOrder";
import { convertFileToImage } from "../../../../image/imageHelper";
import { batch, useDispatch } from "react-redux";
import {
  addImages,
  setActiveImage,
  setSelectedAnnotations,
} from "../../../../store/slices";

//TODO this is taken from OptimizerSettingsGrid - DNR
const enumKeys = <O extends object, K extends keyof O = keyof O>(
  obj: O
): K[] => {
  return Object.keys(obj).filter((k) => Number.isNaN(+k)) as K[];
};

export interface DimensionsOrderDialogProps {
  files: FileList;
  open: boolean;
  onClose: () => void;
}

export const DimensionsOrderDialog = (props: DimensionsOrderDialogProps) => {
  const dispatch = useDispatch();

  const { files, open, onClose } = props;

  const [selectedDimensions, setSelectedDimensions] =
    React.useState<DimensionOrder>(DimensionOrder.YXC);

  const onClick = async (selected: DimensionOrder) => {
    setSelectedDimensions(selected);
    onClose();

    //TODO this is where we call the image reading code
    debugger;

    for (let i = 0; i < files.length; i++) {
      if (i === 0) {
        dispatch(
          setSelectedAnnotations({
            selectedAnnotations: [],
            selectedAnnotation: undefined,
          })
        );
      }
      const dimension_order = "channels_first"; //TODO at some point (obviously) we don't want this to be hard coded

      const image = await convertFileToImage(files[i], dimension_order);

      batch(() => {
        dispatch(addImages({ newImages: [image] }));
        if (i === 0) dispatch(setActiveImage({ image: image.id }));
      });
    }
  };

  return (
    <Dialog onClose={onClose} open={open}>
      <DialogTitle>Set dimensions order: </DialogTitle>
      <List sx={{ pt: 0 }}>
        {enumKeys(DimensionOrder).map((k) => {
          return (
            <ListItem button onClick={() => onClick(DimensionOrder[k])} key={k}>
              <ListItemText primary={DimensionOrder[k]} />
            </ListItem>
          );
        })}
      </List>
    </Dialog>
  );
};
