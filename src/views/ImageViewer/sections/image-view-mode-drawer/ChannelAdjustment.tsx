import { useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { produce } from "immer";
import {
  Box,
  Checkbox,
  debounce,
  Divider,
  IconButton,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Slider,
} from "@mui/material";
import TuneIcon from "@mui/icons-material/Tune";

import { useLocalGlobalState, useTranslation } from "hooks";

import { CustomListItem, CustomListItemButton } from "components/ui";
import { ApplyColorsButton } from "views/ImageViewer/components";
import { selectLoadMessage } from "store/applicationSettings/selectors";

import { rgbToHex } from "utils/colorUtils";
import { scaleDownRange, scaleUpRange } from "utils/dataUtils";
import { generateDefaultColors } from "utils/tensorUtils";
import { BitDepth } from "store/data/types";
import { dataSlice } from "store/data";
import {
  selectActiveImage,
  selectActiveImageRawColor,
} from "views/ImageViewer/state/image-viewer-data/reselectors";

export const ChannelAdjustment = () => {
  const dispatch = useDispatch();
  const t = useTranslation();

  const activeImage = useSelector(selectActiveImage);
  const progressMessage = useSelector(selectLoadMessage);

  const handleResetChannelsClick = async () => {
    if (!activeImage) return;

    const defaultColors = await generateDefaultColors(activeImage.data);

    dispatch(
      dataSlice.actions.updateImageData({
        id: activeImage.id!,
        changes: { colors: defaultColors },
      }),
    );
  };

  return (
    <Box
      sx={{
        display: "flex",
        bgcolor: "background.paper",
        width: "100%",
      }}
    >
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
    </Box>
  );
};

const ChannelsList = () => {
  const dispatch = useDispatch();
  const activeImage = useSelector(selectActiveImage);
  const activeImageRawColor = useSelector(selectActiveImageRawColor);
  const [selectedChannelIndex, setSelectedChannelIndex] = useState<number>(0);

  const {
    localState: localActiveImageColors,
    setLocalState: setLocalActiveImageColors,
    dispatchState: dispatchActiveImageColors,
  } = useLocalGlobalState(
    selectActiveImageRawColor,
    dataSlice.actions.updateImageData,
    {
      range: {},
      visible: {},
      color: [],
    },
  );

  const handleSliderChange = useMemo(
    () =>
      debounce(
        (idx: number, newValue: [number, number], bitDepth: BitDepth) => {
          if (!activeImage) return;
          const ranges = { ...activeImage.colors!.range };
          console.log(newValue);
          console.log(ranges);
          ranges[idx] = scaleDownRange(newValue, bitDepth);
          console.log(ranges);
          dispatch(
            dataSlice.actions.updateImageData({
              id: activeImage?.id,
              changes: { colors: { ...activeImage.colors!, range: ranges } },
            }),
          );
          // setLocalActiveImageColors(
          //   produce((draftColor) => {
          //     draftColor.range[idx] = scaleDownRange(newValue, bitDepth);
          //   }),
          // );
        },
        10,
      ),
    [setLocalActiveImageColors],
  );

  const handleSliderChangeCommitted = async () => {
    return;
    // if (!activeImage) return;
    // dispatchActiveImageColors({
    //   id: activeImage.id,
    //   changes: {
    //     colors: {
    //       ...localActiveImageColors,
    //     },
    //   },
    // });
  };

  const onCheckboxChanged = (index: number, enabled: boolean) => {
    if (!activeImage) return;
    const newColors = {
      visible: { ...activeImageRawColor.visible }, // copy so we can modify
      range: activeImageRawColor.range,
      color: activeImageRawColor.color,
    };
    newColors.visible[index] = enabled;
    dispatch(
      dataSlice.actions.updateImageData({
        id: activeImage.id,
        changes: { colors: newColors },
      }),
    );
  };

  const colorAdjustmentSlider = (index: number, name: string) => {
    const isVisible = activeImageRawColor.visible[index];

    return (
      <ListItem dense disableGutters disablePadding key={index}>
        <ListItemText primary={name} sx={{ mr: 1 }} />

        <ListItemIcon>
          <Checkbox
            onChange={(event) => onCheckboxChanged(index, event.target.checked)}
            checked={isVisible}
            disableRipple
            edge="start"
            tabIndex={-1}
            size="small"
            sx={{
              py: 0,
              px: 1,
              color: rgbToHex(activeImageRawColor.color[index]),
              "&.Mui-checked": {
                color: rgbToHex(activeImageRawColor.color[index]),
              },
            }}
          />
        </ListItemIcon>
        {/* <Palette channelIdx={index} /> */}
        <IconButton size="small" onClick={() => setSelectedChannelIndex(index)}>
          <TuneIcon />
        </IconButton>
      </ListItem>
    );
  };

  return activeImage ? (
    <Box
      sx={{ display: "grid", gridTemplateColumns: "200px 1fr", width: "100%" }}
    >
      <List
        dense
        sx={{
          height: "100px",
          overflowY: "auto",
          pl: 1,
        }}
      >
        {Array(activeImageRawColor.color.length)
          .fill(0)
          .map((_, i) => {
            return colorAdjustmentSlider(i, `Ch. ${i + 1}`);
          })}
      </List>
      <Box
        sx={(theme) => ({
          display: "flex",
          width: "100%",
          justifyContent: "center",
          alignItems: "center",
          borderLeft: `1px solid ${theme.palette.divider}`,
        })}
      >
        {activeImage && activeImageRawColor.color.length > 0 && (
          <Slider
            disabled={!activeImageRawColor.visible[selectedChannelIndex]}
            sx={{
              width: "50%",
              "& .MuiSlider-track": {
                color: (theme) =>
                  activeImageRawColor.visible[selectedChannelIndex]
                    ? rgbToHex(activeImageRawColor.color[selectedChannelIndex])
                    : theme.palette.action.disabled,
              },
            }}
            value={scaleUpRange(
              activeImageRawColor.range[selectedChannelIndex],
              activeImage.bitDepth,
            )}
            max={2 ** activeImage.bitDepth - 1}
            onChange={(event, value: number | number[]) =>
              handleSliderChange(
                selectedChannelIndex,
                value as [number, number],
                activeImage.bitDepth,
              )
            }
            onChangeCommitted={handleSliderChangeCommitted}
            valueLabelDisplay="auto"
            aria-labelledby="range-slider"
            size="small"
          />
        )}
      </Box>
    </Box>
  ) : (
    <></>
  );
};
