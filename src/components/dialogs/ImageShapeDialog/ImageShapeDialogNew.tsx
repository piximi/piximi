import React, { useState } from "react";
import { useDispatch } from "react-redux";
import { useHotkeys } from "hooks";

import { Alert, Box } from "@mui/material";

import { CustomNumberTextField } from "components/forms/CustomNumberTextField";

import { ImageShapeEnum, ImageShapeInfo } from "utils/common/image";

import { HotkeyView } from "types";
import { DialogWithAction } from "../DialogWithAction";
import { uploadImages } from "utils/common/image/upload";
import { applicationSettingsSlice } from "store/slices/applicationSettings";
import { newDataSlice } from "store/slices/newData/newDataSlice";

type ImageShapeDialogProps = {
  files: FileList;
  open: boolean;
  onClose: () => void;
  referenceImageShape: ImageShapeInfo;
};

export const ImageShapeDialogNew = ({
  files,
  open,
  onClose,
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

  const handleUploadImages = async () => {
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

    const res = await uploadImages(
      files,
      channels,
      slices,
      referenceImageShape
    );
    //HACK: Future plans to re-work error messages
    if (res.warning) {
      dispatch(
        applicationSettingsSlice.actions.updateAlertState({
          alertState: res.warning,
        })
      );
    } else if (res.errors.length) {
      dispatch(
        applicationSettingsSlice.actions.updateAlertState({
          alertState: res.errors[0],
        })
      );
    } else {
      dispatch(
        newDataSlice.actions.addThings({
          things: res.imagesToUpload,
          isPermanent: true,
        })
      );
    }

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
      handleUploadImages();
    },
    HotkeyView.ImageShapeDialog,
    { enableOnTags: ["INPUT"] },
    [handleUploadImages]
  );

  return (
    <DialogWithAction
      title="Tell us about your image"
      isOpen={open}
      onClose={closeDialog}
      content={
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
      }
      onConfirm={handleUploadImages}
      confirmText="OK"
    />
  );
};
