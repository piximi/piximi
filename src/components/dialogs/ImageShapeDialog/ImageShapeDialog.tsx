import React, { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useHotkeys } from "hooks";

import { Alert, Box } from "@mui/material";

import { CustomNumberTextField } from "components/forms/CustomNumberTextField";

import { HotkeyView } from "utils/common/enums";
import { DialogWithAction } from "../DialogWithAction";
import { applicationSettingsSlice } from "store/applicationSettings";
import { dataSlice } from "store/data/dataSlice";
import { uploadImages } from "utils/file-io/helpers";
import { ImageShapeInfo } from "utils/file-io/types";
import { ImageShapeEnum } from "utils/file-io/enums";
import { selectUnknownImageCategory } from "store/data/selectors";

type ImageShapeDialogProps = {
  files: FileList;
  open: boolean;
  onClose: () => void;
  referenceImageShape: ImageShapeInfo;
};

export const ImageShapeDialog = ({
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

  const unknownImageCategory = useSelector(selectUnknownImageCategory);

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
      referenceImageShape,
      unknownImageCategory
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
        dataSlice.actions.addThings({
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
