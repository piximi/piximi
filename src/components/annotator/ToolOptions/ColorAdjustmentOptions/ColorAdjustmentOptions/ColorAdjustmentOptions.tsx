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
  generateDefaultChannels,
  createRenderedTensor,
  findMinMaxs,
} from "image/utils/imageHelper";

export const ColorAdjustmentOptions = () => {
  const t = useTranslation();

  const dispatch = useDispatch();

  const activeImagePlane = useSelector(activeImagePlaneSelector);

  const imageShape = useSelector(imageShapeSelector);

  const imageData = useSelector(imageDataSelector);

  const imageBitDepth = useSelector(imageBitDepthSelector);

  const onResetChannelsClick = async () => {
    if (!imageShape) return;

    const defaultChannels = generateDefaultChannels(imageShape.channels);

    dispatch(
      imageViewerSlice.actions.setImageColors({
        colors: defaultChannels,
        execSaga: true,
      })
    );

    if (!imageData || !imageShape || !imageBitDepth) return;

    const [mins, maxs] = await findMinMaxs(imageData);

    const modifiedSrc = await createRenderedTensor(
      imageData,
      defaultChannels,
      imageBitDepth,
      { mins, maxs },
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
