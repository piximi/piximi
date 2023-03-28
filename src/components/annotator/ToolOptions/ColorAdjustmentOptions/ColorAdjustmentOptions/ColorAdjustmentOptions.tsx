import React from "react";
import { useDispatch, useSelector } from "react-redux";

import { Divider, List, ListItem, ListItemText } from "@mui/material";

import { useTranslation } from "hooks";

import { ZStackSlider } from "../ZStackSlider";
import { ApplyColorsButton } from "../ApplyColorsButton";
import { ChannelsList } from "../ChannelsList";

import { activeImageIdSelector } from "store/annotator";
import {
  DataSlice,
  selectActiveImageData,
  selectActiveImageShape,
} from "store/data";

import { generateDefaultColors } from "utils/common/image";

export const ColorAdjustmentOptions = () => {
  const t = useTranslation();

  const dispatch = useDispatch();

  const imageShape = useSelector(selectActiveImageShape);

  const imageData = useSelector(selectActiveImageData);

  const imageId = useSelector(activeImageIdSelector);

  const onResetChannelsClick = async () => {
    if (!imageShape || !imageData) return;

    const defaultColors = await generateDefaultColors(imageData);

    dispatch(
      DataSlice.actions.updateStagedImage({
        imageId: imageId!,
        updates: { colors: defaultColors },
        disposeColors: true,
        execSaga: true,
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
        <ListItem button onClick={onResetChannelsClick}>
          <ListItemText>{t("Reset colors")}</ListItemText>
        </ListItem>
        <ApplyColorsButton />
      </List>
    </>
  );
};
