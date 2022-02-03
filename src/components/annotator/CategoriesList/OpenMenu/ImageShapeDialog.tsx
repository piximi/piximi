import * as React from "react";
import DialogTitle from "@mui/material/DialogTitle";
import Dialog from "@mui/material/Dialog";
import { convertFileToImage } from "../../../../image/imageHelper";
import { useDispatch, useSelector } from "react-redux";
import { Box, Button, DialogActions, TextField } from "@mui/material";
import {
  imageViewerSlice,
  setOperation,
  setSelectedAnnotations,
} from "../../../../store/slices";
import { currentColorsSelector } from "../../../../store/selectors/currentColorsSelector";
import { ToolType } from "../../../../types/ToolType";

export interface ImageShapeDialogProps {
  files: FileList;
  open: boolean;
  onClose: () => void;
}

export const ImageShapeDialog = (props: ImageShapeDialogProps) => {
  const dispatch = useDispatch();

  const colors = useSelector(currentColorsSelector);

  const { files, open, onClose } = props;

  const handleChannelsChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setChannels(parseInt(event.target.value));
  };
  const handleSlicesChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSlices(parseInt(event.target.value));
  };

  const [channels, setChannels] = React.useState<number>(3);
  const [slices, setSlices] = React.useState<number>(1);

  const onClick = async () => {
    onClose();

    for (let i = 0; i < files.length; i++) {
      const image = await convertFileToImage(
        files[i],
        colors,
        slices,
        channels
      );
      dispatch(imageViewerSlice.actions.addImages({ newImages: [image] }));
      if (i === 0) {
        dispatch(imageViewerSlice.actions.setActiveImage({ image: image.id }));
        dispatch(
          setSelectedAnnotations({
            selectedAnnotations: [],
            selectedAnnotation: undefined,
          })
        );

        dispatch(setOperation({ operation: ToolType.RectangularAnnotation }));
      }
    }
  };

  return (
    <Dialog onClose={onClose} open={open}>
      <DialogTitle>Tell us about your image: </DialogTitle>
      <Box
        component="form"
        sx={{
          "& .MuiTextField-root": { m: 1, width: "25ch" },
        }}
        noValidate
        autoComplete="off"
      >
        <TextField
          InputLabelProps={{
            shrink: true,
          }}
          id="outlined-required"
          type="number"
          label="Slices (z)"
          value={slices}
          onChange={handleSlicesChange}
        />
        <TextField
          InputLabelProps={{
            shrink: true,
          }}
          id="outlined-required"
          type="number"
          label="Channels (c)"
          value={channels}
          onChange={handleChannelsChange}
        />
      </Box>
      <DialogActions>
        <Button onClick={onClick} autoFocus>
          OK
        </Button>
      </DialogActions>
    </Dialog>
  );
};
