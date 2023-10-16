import React from "react";
import { useDispatch, useSelector } from "react-redux";

import { Divider, List } from "@mui/material";

import { useTranslation } from "hooks";

import { ZStackSlider } from "../ZStackSlider";
import { ApplyColorsButton } from "../ApplyColorsButton";
import { ChannelsList } from "../ChannelsList";

import { selectActiveImageId } from "store/imageViewer";
import {
  dataSlice,
  selectActiveImageData,
  selectActiveImageShape,
} from "store/data";

import { generateDefaultColors } from "utils/common/image";
import { CustomListItemButton } from "components/list-items/CustomListItemButton";
import { CustomListItem } from "components/list-items/CustomListItem";
import { selectLoadMessage } from "store/project";

//TODO: Check

export const ColorAdjustmentOptions = () => {
  const t = useTranslation();

  const dispatch = useDispatch();

  const imageShape = useSelector(selectActiveImageShape);

  const imageData = useSelector(selectActiveImageData);

  const imageId = useSelector(selectActiveImageId);
  const progressMessage = useSelector(selectLoadMessage);

  const handleResetChannelsClick = async () => {
    if (!imageShape || !imageData) return;

    const defaultColors = await generateDefaultColors(imageData);

    dispatch(
      dataSlice.actions.updateImages({
        updates: [{ id: imageId!, colors: defaultColors }],
      })
    );
  };

  return (
    <>
      <Divider />

      <ZStackSlider />

      <Divider />

      <ChannelsList />

      <Divider />

      <List dense>
        <CustomListItemButton
          primaryText={t("Reset colors")}
          onClick={handleResetChannelsClick}
        />
        <ApplyColorsButton />
        {progressMessage && <CustomListItem primaryText={progressMessage} />}
      </List>
    </>
  );
};
