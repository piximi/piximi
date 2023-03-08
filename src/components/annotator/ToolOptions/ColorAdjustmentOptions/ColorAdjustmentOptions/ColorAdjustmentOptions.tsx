import React from "react";
import { useDispatch, useSelector } from "react-redux";

import { Divider, List, ListItem, ListItemText } from "@mui/material";

import { useTranslation } from "hooks";

import { ZStackSlider } from "../ZStackSlider";
import { ApplyColorsButton } from "../ApplyColorsButton";
import { ChannelsList } from "../ChannelsList";

import { AnnotatorSlice, imageShapeSelector } from "store/annotator";

import { imageDataSelector } from "store/common";

import { generateDefaultColors } from "utils/common/image";

export const ColorAdjustmentOptions = () => {
  const t = useTranslation();

  const dispatch = useDispatch();

  const imageShape = useSelector(imageShapeSelector);

  const imageData = useSelector(imageDataSelector);

  const onResetChannelsClick = async () => {
    if (!imageShape || !imageData) return;

    const defaultColors = await generateDefaultColors(imageData);

    dispatch(
      AnnotatorSlice.actions.setImageColors({
        colors: defaultColors,
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
