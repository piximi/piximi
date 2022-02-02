import React, { useEffect } from "react";
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
  convertSrcURIToOriginalSrcURIs,
  generateDefaultChannels,
  mapChannelstoSpecifiedRGBImage,
} from "../../../../../image/imageHelper";
import { activeImagePlaneSelector } from "../../../../../store/selectors/activeImagePlaneSelector";
import { ApplyColorsButton } from "../ApplyColorsButton";
import { activeImageIdSelector } from "../../../../../store/selectors/activeImageIdSelector";
import { imageSrcSelector } from "../../../../../store/selectors/imageSrcSelector";

export const ColorAdjustmentOptions = () => {
  const t = useTranslation();

  const dispatch = useDispatch();

  const originalSrc = useSelector(imageOriginalSrcSelector);

  const src = useSelector(imageSrcSelector);

  const activeImagePlane = useSelector(activeImagePlaneSelector);

  const activeImageId = useSelector(activeImageIdSelector);

  const imageShape = useSelector(imageShapeSelector);

  const [originalData, setOriginalData] = React.useState<
    Array<Array<Array<number>>>
  >([]);

  const onResetChannelsClick = () => {
    if (!imageShape) return;

    const defaultChannels = generateDefaultChannels(imageShape.channels);

    dispatch(
      imageViewerSlice.actions.setImageColors({
        colors: defaultChannels,
      })
    );

    if (!originalSrc || !imageShape) return;

    const modifiedURI = mapChannelstoSpecifiedRGBImage(
      originalData[activeImagePlane],
      defaultChannels,
      imageShape.height,
      imageShape.width
    );

    dispatch(imageViewerSlice.actions.setImageSrc({ src: modifiedURI }));
  };

  useEffect(() => {
    if (!activeImageId) return;

    const fetchData = async () => {
      if (!originalSrc) return;

      let originalURIs: Array<Array<string>> = [];

      if (!originalSrc.length && src && imageShape) {
        //if nothing in originalSrc, attempt to compute it from src -- this makes the assumption of RGB image
        const sliceData = await convertSrcURIToOriginalSrcURIs(src, imageShape);
        originalURIs = [sliceData];
      } else {
        originalURIs = originalSrc;
      }

      return await convertImageURIsToImageData(originalURIs);
    };

    fetchData().then((data: Array<Array<Array<number>>> | undefined) => {
      if (!data) return;
      setOriginalData(data);
    });
  }, [activeImageId, originalSrc]);

  return (
    <>
      <InformationBox description="…" name={t("Color adjustment")} />

      <Divider />

      <ZStackSlider originalData={originalData} />

      <Divider />

      <ChannelsList originalData={originalData} />

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
