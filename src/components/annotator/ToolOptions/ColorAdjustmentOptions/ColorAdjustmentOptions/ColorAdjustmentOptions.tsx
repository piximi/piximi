import React from "react";
import { useDispatch, useSelector } from "react-redux";

import { Divider, List, ListItem, ListItemText } from "@mui/material";

import { useTranslation } from "hooks";

import { ZStackSlider } from "../ZStackSlider";
import { ApplyColorsButton } from "../ApplyColorsButton";
import { ChannelsList } from "../ChannelsList";
import { InformationBox } from "../../InformationBox";

import {
  imageViewerSlice,
  imageShapeSelector,
  activeImagePlaneSelector,
} from "store/image-viewer";

import { imageDataSelector, imageBitDepthSelector } from "store/common";

import {
  generateDefaultColors,
  createRenderedTensor,
} from "image/utils/imageHelper";

export const ColorAdjustmentOptions = () => {
  const t = useTranslation();

  const dispatch = useDispatch();

  const activeImagePlane = useSelector(activeImagePlaneSelector);

  const imageShape = useSelector(imageShapeSelector);

  const imageData = useSelector(imageDataSelector);

  const imageBitDepth = useSelector(imageBitDepthSelector);

  const onResetChannelsClick = async () => {
    if (!imageShape || !imageData) return;

    const defaultColors = await generateDefaultColors(imageData);

    dispatch(
      imageViewerSlice.actions.setImageColors({
        colors: defaultColors,
        execSaga: true,
      })
    );

    if (!imageData || !imageShape || !imageBitDepth) return;

    const modifiedSrc = await createRenderedTensor(
      imageData,
      defaultColors,
      imageBitDepth,
      activeImagePlane
    );

    dispatch(imageViewerSlice.actions.setImageSrc({ src: modifiedSrc }));
  };

  return (
    <>
      <InformationBox description="…" name={t("Color adjustment")} />

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
