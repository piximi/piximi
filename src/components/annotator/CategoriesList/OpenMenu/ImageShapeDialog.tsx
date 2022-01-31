import * as React from "react";
import List from "@mui/material/List";
import ListItem from "@mui/material/ListItem";
import ListItemText from "@mui/material/ListItemText";
import DialogTitle from "@mui/material/DialogTitle";
import Dialog from "@mui/material/Dialog";
import {
  convertFileToImage,
  generateDefaultChannels,
} from "../../../../image/imageHelper";
import { useDispatch } from "react-redux";
import ListItemIcon from "@mui/material/ListItemIcon";
import Checkbox from "@mui/material/Checkbox";
import { CheckboxCheckedIcon, CheckboxUncheckedIcon } from "../../../../icons";
import { Button, DialogActions, TextField } from "@mui/material";
import { imageViewerSlice } from "../../../../store/slices";

export interface ImageShapeDialogProps {
  files: FileList;
  open: boolean;
  onClose: () => void;
}

export const ImageShapeDialog = (props: ImageShapeDialogProps) => {
  const dispatch = useDispatch();

  const [isStack, setIsStack] = React.useState<boolean>(false);

  const { files, open, onClose } = props;

  const onClick = async () => {
    onClose();

    for (let i = 0; i < files.length; i++) {
      const image = await convertFileToImage(files[i], isStack);
      dispatch(imageViewerSlice.actions.addImages({ newImages: [image] }));
      if (i === 0) {
        dispatch(imageViewerSlice.actions.setActiveImage({ image: image.id }));
      }
    }
  };

  return (
    <Dialog onClose={onClose} open={open}>
      <DialogTitle>Tell us about your image: </DialogTitle>
      <List dense>
        <ListItem>
          <ListItemIcon>
            <Checkbox
              onClick={
                isStack ? () => setIsStack(false) : () => setIsStack(true)
              }
              checked={isStack}
              icon={<CheckboxUncheckedIcon />}
              checkedIcon={<CheckboxCheckedIcon />}
            />
          </ListItemIcon>
          <ListItemText primary={"Is image a z-stack?"} />
        </ListItem>
        <ListItem>
          <TextField
            required
            disabled={!isStack}
            id="outlined-required"
            label="Slices (z)"
          />
        </ListItem>
        <ListItem>
          <TextField required id="outlined-required" label="Channels (c)" />
        </ListItem>
      </List>
      <DialogActions>
        <Button onClick={onClick} autoFocus>
          OK
        </Button>
      </DialogActions>
    </Dialog>
  );
};
