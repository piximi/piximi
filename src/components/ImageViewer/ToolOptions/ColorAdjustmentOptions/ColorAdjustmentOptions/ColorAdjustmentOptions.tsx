import React, { useEffect, useLayoutEffect, useState } from "react";
import { InformationBox } from "../../InformationBox";
import Divider from "@mui/material/Divider";
import { useTranslation } from "../../../../../annotator/hooks/useTranslation";
import List from "@mui/material/List";
import ListItem from "@mui/material/ListItem";
import ListItemText from "@mui/material/ListItemText";
import { useDispatch, useSelector } from "react-redux";
import { applicationSlice } from "../../../../../annotator/store";
import { imageOriginalSrcSelector } from "../../../../../store/selectors";
import { ChannelsList } from "../ChannelsList";
import { channelsSelector } from "../../../../../store/selectors/intensityRangeSelector";
import { ChannelType } from "../../../../../types/ChannelType";
import { imageShapeSelector } from "../../../../../store/selectors/imageShapeSelector";
import { CollapsibleList } from "../../../CategoriesList/CollapsibleList";
import Slider from "@mui/material/Slider";

const LightnessListItem = ({ name }: { name: string }) => {
  const t = useTranslation();

  return (
    <ListItem alignItems="flex-start" dense>
      <ListItemText
        primary={t(name)}
        secondary={
          <Slider
            defaultValue={0}
            valueLabelDisplay="auto"
            step={1}
            marks
            min={-200}
            max={200}
          />
        }
      />
    </ListItem>
  );
};

const LightnessList = () => {
  const t = useTranslation();

  return (
    <CollapsibleList closed dense primary={t("Lightness")}>
      <LightnessListItem name="Exposure" />
      <LightnessListItem name="Highlights" />
      <LightnessListItem name="Shadows" />
      <LightnessListItem name="Brightness" />
      <LightnessListItem name="Contrast" />
      <LightnessListItem name="Black Point" />
    </CollapsibleList>
  );
};

const HueAndSaturationListItem = ({ name }: { name: string }) => {
  const t = useTranslation();

  return (
    <ListItem alignItems="flex-start" dense>
      <ListItemText
        primary={t(name)}
        secondary={
          <Slider
            defaultValue={0}
            valueLabelDisplay="auto"
            step={1}
            marks
            min={-200}
            max={200}
          />
        }
      />
    </ListItem>
  );
};

const HueAndSaturationList = () => {
  const t = useTranslation();

  return (
    <CollapsibleList closed dense primary={t("Hue & Saturation")}>
      <HueAndSaturationListItem name="Hue" />
      <HueAndSaturationListItem name="Saturation" />
      <HueAndSaturationListItem name="Vibrance" />
    </CollapsibleList>
  );
};

export function createIntensityFilter(channels: ChannelType[]) {
  return function (imageData: { data: any }) {
    let data = imageData.data;
    const scaleIntensity = (channel: ChannelType, pixel: number) => {
      if (!channel.visible) return 0;
      if (pixel < channel.range[0]) return 0;
      if (pixel >= channel.range[1]) return 255;
      return (
        255 *
        ((pixel - channel.range[0]) / (channel.range[1] - channel.range[0]))
      );
    };

    for (let i = 0; i < data.length; i += 4) {
      // red
      data[i] = scaleIntensity(channels[0], data[i]);
      // green
      data[i + 1] = scaleIntensity(channels[1], data[i + 1]);
      // blue
      data[i + 2] = scaleIntensity(channels[2], data[i + 2]);
    }
    return data;
  };
}

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
  }, [originalSrc]);

  const onResetChannelsClick = () => {
    if (!imageShape) return;
    const defaultChannels = generateDefaultChannels(imageShape.channels);
    dispatch(
      applicationSlice.actions.setChannels({
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
