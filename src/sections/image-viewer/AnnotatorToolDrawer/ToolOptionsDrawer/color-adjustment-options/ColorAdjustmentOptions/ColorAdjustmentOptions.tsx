import React from "react";
import { useDispatch, useSelector } from "react-redux";

import { Divider, List } from "@mui/material";

import { useTranslation } from "hooks";

import { ZStackSlider } from "../ZStackSlider";
import { ApplyColorsButton } from "../ApplyColorsButton";
import { ChannelsList } from "../ChannelsList";

import { CustomListItemButton } from "components/CustomListItemButton";
import { CustomListItem } from "components/CustomListItem";
import { selectLoadMessage } from "store/project/selectors";
import { selectActiveImage } from "store/imageViewer/reselectors";
import { dataSlice } from "store/data/dataSlice";
import { generateDefaultColors } from "utils/common/tensorHelpers";

//TODO: Check

export const ColorAdjustmentOptions = () => {
  const t = useTranslation();

  const dispatch = useDispatch();
  const activeImage = useSelector(selectActiveImage);
  const progressMessage = useSelector(selectLoadMessage);

  const handleResetChannelsClick = async () => {
    if (!activeImage) return;

    const defaultColors = await generateDefaultColors(activeImage.data);

    dispatch(
      dataSlice.actions.updateThings({
        updates: [{ id: activeImage.id!, colors: defaultColors }],
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
