import React, { useEffect, useState } from "react";
import { InformationBox } from "../../InformationBox";
import Divider from "@mui/material/Divider";
import { useTranslation } from "../../../../../hooks/useTranslation";
import List from "@mui/material/List";
import ListItem from "@mui/material/ListItem";
import ListItemText from "@mui/material/ListItemText";
import { useDispatch, useSelector } from "react-redux";
import { imageOriginalSrcSelector } from "../../../../../store/selectors";
import { ChannelsList } from "../ChannelsList";
import { channelsSelector } from "../../../../../store/selectors/intensityRangeSelector";
import { ChannelType } from "../../../../../types/ChannelType";
import { imageShapeSelector } from "../../../../../store/selectors/imageShapeSelector";
import { imageViewerSlice } from "../../../../../store/slices";
import { ZStackSlider } from "../ZStackSlider";
import { DEFAULT_COLORS } from "../../../../../types/Colors";

export const ColorAdjustmentOptions = () => {
  const t = useTranslation();

  const dispatch = useDispatch();

  const originalSrc = useSelector(imageOriginalSrcSelector);

  const imageShape = useSelector(imageShapeSelector);

  const channels = useSelector(channelsSelector);

  const [displayedValues, setDisplayedValues] = useState<Array<Array<number>>>(
    channels.map((channel: ChannelType) => [...channel.range])
  ); //we keep that state variable here and pass it to slider so that visible slider ranges can change accordingly

  const generateDefaultChannels = (components: number) => {
    const defaultChannels: Array<ChannelType> = []; //number of channels depends on whether image is greyscale or RGB
    for (let i = 0; i < components; i++) {
      defaultChannels.push({
        color: DEFAULT_COLORS[i],
        range: [0, 255],
        visible: true,
      });
    }
    return defaultChannels;
  };

  useEffect(() => {
    if (!originalSrc) return;

    if (!imageShape) return;

    setDisplayedValues(
      channels.map((channel: ChannelType) => [...channel.range])
    );
  }, [originalSrc, imageShape, channels]);

  const onResetChannelsClick = () => {
    if (!imageShape) return;
    const defaultChannels = generateDefaultChannels(imageShape.channels);
    dispatch(
      imageViewerSlice.actions.setChannels({
        channels: defaultChannels,
      })
    );
    setDisplayedValues(
      defaultChannels.map((channel: ChannelType) => [...channel.range])
    );
  };

  const updateDisplayedValues = (values: Array<Array<number>>) => {
    setDisplayedValues(values);
  };

  return (
    <>
      <InformationBox description="…" name={t("Color adjustment")} />

      <Divider />

      <ZStackSlider />

      <Divider />

      <ChannelsList
        displayedValues={displayedValues}
        updateDisplayedValues={updateDisplayedValues}
      />

      <Divider />

      <List dense>
        <ListItem button onClick={onResetChannelsClick}>
          <ListItemText>{t("Reset")}</ListItemText>
        </ListItem>
      </List>
    </>
  );
};
