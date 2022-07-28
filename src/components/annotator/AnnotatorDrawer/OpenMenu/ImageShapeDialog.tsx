import React, { useState } from "react";
import * as ImageJS from "image-js";
import DialogTitle from "@mui/material/DialogTitle";
import Dialog from "@mui/material/Dialog";
import { ImageShapeEnum } from "../../../../image/imageHelper";
import { useDispatch } from "react-redux";
import { Alert, Box, Button, DialogActions } from "@mui/material";
import { applicationSlice } from "../../../../store/slices";
import { CustomNumberTextField } from "components/CustomNumberTextField/CustomNumberTextField";
import { useHotkeys } from "react-hotkeys-hook";

type ImageShapeDialogProps = {
  files: FileList;
  open: boolean;
  onClose: () => void;
  isUploadedFromAnnotator: boolean;
};

export const ImageShapeDialog = ({
  files,
  open,
  onClose,
  isUploadedFromAnnotator,
}: ImageShapeDialogProps) => {
  const dispatch = useDispatch();

  const [channels, setChannels] = useState<number>(3);

  const [frames, setFrames] = useState<number>(-1);
  const [invalidImageShape, setInvalidImageShape] = useState<boolean>(false);

  const handleChannelsChange = async (channels: number) => {
    setChannels(channels);
  };

  const uploadImages = async () => {
    var imageFrames = frames;
    if (imageFrames === -1) {
      const buffer = await files[0].arrayBuffer();
      const image = await ImageJS.Image.load(buffer, { ignorePalette: true });

      imageFrames = Array.isArray(image) ? image.length : 1;
      setFrames(imageFrames);
    }

    const slices = imageFrames / channels;

    if (!Number.isInteger(slices)) {
      setInvalidImageShape(true);
      return;
    }
    setInvalidImageShape(false);

    dispatch(
      applicationSlice.actions.uploadImages({
        files: files,
        channels: channels,
        slices: slices,
        imageShapeInfo: ImageShapeEnum.HyperStackImage,
        isUploadedFromAnnotator: isUploadedFromAnnotator,
      })
    );

    closeDialog();
  };

  const closeDialog = () => {
    setInvalidImageShape(false);
    setFrames(-1);
    onClose();
  };

  useHotkeys(
    "enter",
    () => {
      uploadImages();
    },
    { enabled: open },
    [uploadImages]
  );

  return (
    <Dialog onClose={closeDialog} open={open}>
      <DialogTitle sx={{ pb: 0 }}>Tell us about your image: </DialogTitle>
      <Box sx={{ pl: 3, pt: 0, pb: 0, width: "28ch" }}>
        <CustomNumberTextField
          id="channels-c"
          label="Channels (c)"
          value={channels}
          dispatchCallBack={handleChannelsChange}
          min={1}
        />
        {invalidImageShape && (
          <Alert
            sx={{ width: "28ch" }}
            severity="warning"
          >{`Invalid image shape: Cannot create a ${channels} (c) x ${(
            frames / channels
          ).toFixed(2)} (z) image from file.`}</Alert>
        )}
      </Box>
      <DialogActions>
        <Button onClick={uploadImages} autoFocus>
          OK
        </Button>
      </DialogActions>
    </Dialog>
  );
};
