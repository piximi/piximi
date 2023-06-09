import React, { useState } from "react";
import { useDispatch } from "react-redux";
import { useHotkeys } from "hooks";

import {
  Alert,
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogTitle,
} from "@mui/material";

import { CustomNumberTextField } from "../styled-components/CustomNumberTextField";

import { dataSlice } from "store/data";

import { ImageShapeEnum, ImageShapeInfo } from "utils/common/image";

import { HotkeyView } from "types";

type ImageShapeDialogProps = {
  files: FileList;
  open: boolean;
  onClose: () => void;
  isUploadedFromAnnotator: boolean;
  referenceImageShape: ImageShapeInfo;
};

export const ImageShapeDialog = ({
  files,
  open,
  onClose,
  isUploadedFromAnnotator,
  referenceImageShape,
}: ImageShapeDialogProps) => {
  const dispatch = useDispatch();

  const [channels, setChannels] = useState<number>(
    referenceImageShape.components && referenceImageShape.components % 3 !== 0
      ? referenceImageShape.components
      : 3 // assume 3 if no compnents key set or if cleanly divisible by 3
  );

  const [frames, setFrames] = useState<number>(-1);
  const [invalidImageShape, setInvalidImageShape] = useState<boolean>(false);

  const handleChannelsChange = async (channels: number) => {
    setChannels(channels);
  };

  const uploadImages = async () => {
    var imageFrames = frames;
    if (imageFrames === -1) {
      imageFrames =
        referenceImageShape.shape === ImageShapeEnum.HyperStackImage
          ? referenceImageShape.components! // components always set on HyperStackImage
          : 1;
      setFrames(imageFrames);
    }

    const slices = imageFrames / channels;

    // check if user-supplied channels cleanly divides known num frames
    if (!Number.isInteger(slices)) {
      setInvalidImageShape(true);
      return;
    }
    setInvalidImageShape(false);

    dispatch(
      dataSlice.actions.uploadImages({
        files: files,
        channels: channels,
        slices: slices,
        referenceShape: referenceImageShape,
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
    HotkeyView.ImageShapeDialog,
    { enableOnTags: ["INPUT"] },
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
