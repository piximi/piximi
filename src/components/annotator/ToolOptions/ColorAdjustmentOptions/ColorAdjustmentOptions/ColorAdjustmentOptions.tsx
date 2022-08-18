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
import { imageOriginalSrcSelector } from "store/common";

import {
  convertImageURIsToImageData,
  generateDefaultChannels,
  mapChannelsToSpecifiedRGBImage,
} from "image/imageHelper";

export const ColorAdjustmentOptions = () => {
  const t = useTranslation();

  const dispatch = useDispatch();

  const activeImagePlane = useSelector(activeImagePlaneSelector);

  const imageShape = useSelector(imageShapeSelector);

  const originalSrc = useSelector(imageOriginalSrcSelector);

  const onResetChannelsClick = async () => {
    if (!imageShape) return;

    const defaultChannels = generateDefaultChannels(imageShape.channels);

    dispatch(
      imageViewerSlice.actions.setImageColors({
        colors: defaultChannels,
        execSaga: true,
      })
    );

    if (!originalSrc || !imageShape) return;

    const activePlaneData = (
      await convertImageURIsToImageData(
        new Array(originalSrc[activeImagePlane])
      )
    )[0];

    const modifiedURI = mapChannelsToSpecifiedRGBImage(
      activePlaneData,
      defaultChannels,
      imageShape.height,
      imageShape.width
    );

    dispatch(imageViewerSlice.actions.setImageSrc({ src: modifiedURI }));
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
