import React from "react";
import { InformationBox } from "../../InformationBox";
import Divider from "@mui/material/Divider";
import { useTranslation } from "../../../../../hooks/useTranslation";
import List from "@mui/material/List";
import ListItem from "@mui/material/ListItem";
import ListItemText from "@mui/material/ListItemText";
import { useDispatch, useSelector } from "react-redux";
import { imageOriginalSrcSelector } from "../../../../../store/selectors";
import { ChannelsList } from "../ChannelsList";
import { imageShapeSelector } from "../../../../../store/selectors/imageShapeSelector";
import { imageViewerSlice } from "../../../../../store/slices";
import { ZStackSlider } from "../ZStackSlider";
import {
  convertImageURIsToImageData,
  generateDefaultChannels,
  mapChannelstoSpecifiedRGBImage,
} from "../../../../../image/imageHelper";
import { activeImagePlaneSelector } from "../../../../../store/selectors/activeImagePlaneSelector";
import { ApplyColorsButton } from "../ApplyColorsButton";

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
      })
    );

    if (!originalSrc || !imageShape) return;

    const originalData = await convertImageURIsToImageData([
      originalSrc[activeImagePlane],
    ]);

    const modifiedURI = mapChannelstoSpecifiedRGBImage(
      originalData[0],
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
