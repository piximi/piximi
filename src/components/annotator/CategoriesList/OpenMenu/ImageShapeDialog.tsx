import * as React from "react";
import DialogTitle from "@mui/material/DialogTitle";
import Dialog from "@mui/material/Dialog";
import { convertFileToImage } from "../../../../image/imageHelper";
import { useDispatch, useSelector } from "react-redux";
import { Box, Button, DialogActions, TextField } from "@mui/material";
import {
  applicationSlice,
  createImage,
  imageViewerSlice,
  setOperation,
  setSelectedAnnotations,
} from "../../../../store/slices";
import { currentColorsSelector } from "../../../../store/selectors/currentColorsSelector";
import { ToolType } from "../../../../types/ToolType";
import { AlertStateType, AlertType } from "types/AlertStateType";
import { getStackTraceFromError } from "utils/getStackTrace";

export interface ImageShapeDialogProps {
  files: FileList;
  open: boolean;
  onClose: () => void;
  isUploadedFromAnnotator: boolean;
}

export const ImageShapeDialog = (props: ImageShapeDialogProps) => {
  const dispatch = useDispatch();

  const colors = useSelector(currentColorsSelector);

  const { files, open, onClose, isUploadedFromAnnotator } = props;

  const handleChannelsChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setChannels(parseInt(event.target.value));
  };
  const handleSlicesChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSlices(parseInt(event.target.value));
  };

  const [channels, setChannels] = React.useState<number>(3);
  const [slices, setSlices] = React.useState<number>(1);

  const onConfirm = async () => {
    onClose();

    for (let i = 0; i < files.length; i++) {
      let image;
      try {
        image = await convertFileToImage(files[i], colors, slices, channels);
      } catch (err) {
        const error = err as Error;
        const stackTrace = await getStackTraceFromError(error);
        const warning: AlertStateType = {
          alertType: AlertType.Error,
          name: "Could not convert file to image",
          description: error.message,
          stackTrace: stackTrace,
        };
        dispatch(
          applicationSlice.actions.updateAlertState({ alertState: warning })
        );
        return;
      }
      if (isUploadedFromAnnotator) {
        //if image is uplpoaded from the annotator, we add image to annotator state
        dispatch(imageViewerSlice.actions.addImages({ newImages: [image] }));
        if (i === 0) {
          dispatch(
            imageViewerSlice.actions.setActiveImage({ imageId: image.id })
          );
          dispatch(
            setSelectedAnnotations({
              selectedAnnotations: [],
              selectedAnnotation: undefined,
            })
          );

          dispatch(setOperation({ operation: ToolType.RectangularAnnotation }));
        }
      } else {
        //otherwise, we add image to project state
        dispatch(createImage({ image: image }));
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
        <Button onClick={onConfirm} autoFocus>
          OK
        </Button>
      </DialogActions>
    </Dialog>
  );
};
