import React, { useState } from "react";
import { useDispatch } from "react-redux";
import { useHotkeys } from "hooks";
import * as ImageJS from "image-js";

import {
  Alert,
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogTitle,
} from "@mui/material";

import { CustomNumberTextField } from "components/common/InputFields";

import { applicationSlice } from "store/application";

import { ImageShapeEnum } from "utils/common/imageHelper";
import { HotkeyView } from "types";

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
        execSaga: true,
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
    HotkeyView.ImageShapeDialog,
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
