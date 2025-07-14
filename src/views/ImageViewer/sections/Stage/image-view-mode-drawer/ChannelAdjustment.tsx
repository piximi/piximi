import { useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { produce } from "immer";
import { tensor2d } from "@tensorflow/tfjs";
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
import { annotatorSlice } from "views/ImageViewer/state/annotator";
import { imageViewerSlice } from "views/ImageViewer/state/imageViewer";
import { selectLoadMessage } from "store/applicationSettings/selectors";
import {
  selectActiveImage,
  selectActiveImageRawColor,
} from "views/ImageViewer/state/imageViewer/reselectors";

import { rgbToHex } from "utils/colorUtils";
import { scaleDownRange, scaleUpRange } from "utils/dataUtils";
import { generateDefaultColors } from "utils/tensorUtils";
import { BitDepth } from "store/data/types";

export const ChannelAdjustment = () => {
  const dispatch = useDispatch();
  const t = useTranslation();

  const activeImage = useSelector(selectActiveImage);
  const progressMessage = useSelector(selectLoadMessage);

  const handleResetChannelsClick = async () => {
    if (!activeImage) return;

    const defaultColors = await generateDefaultColors(activeImage.data);

    dispatch(
      annotatorSlice.actions.editThings({
        updates: [{ id: activeImage.id!, colors: defaultColors }],
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
  const [selectedChannelIndex, setSelectedChannelIndex] = useState<number>(0);

  const {
    localState: localActiveImageColors,
    setLocalState: setLocalActiveImageColors,
    dispatchState: dispatchActiveImageColors,
  } = useLocalGlobalState(
    selectActiveImageRawColor,
    imageViewerSlice.actions.updateActiveImageColors,
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
          setLocalActiveImageColors(
            produce((draftColor) => {
              draftColor.range[idx] = scaleDownRange(newValue, bitDepth);
            }),
          );
        },
        10,
      ),
    [setLocalActiveImageColors],
  );

  const handleSliderChangeCommitted = async () => {
    if (!activeImage) return;
    dispatchActiveImageColors({
      colors: {
        ...localActiveImageColors,
        color: tensor2d(localActiveImageColors.color),
      },
    });
  };

  const onCheckboxChanged = (index: number, enabled: boolean) => {
    if (!activeImage) return;
    const newColors = {
      visible: { ...localActiveImageColors.visible }, // copy so we can modify
      range: localActiveImageColors.range,
      color: tensor2d(localActiveImageColors.color),
    };
    newColors.visible[index] = enabled;
    dispatch(
      imageViewerSlice.actions.updateActiveImageColors({
        colors: newColors,
      }),
    );
    // dispatch(
    //   annotatorSlice.actions.editThings({
    //     updates: [{ id: activeImage!.id, colors: newColors }],
    //   }),
    // );
  };

  useEffect(() => {}, [selectedChannelIndex]);
  const colorAdjustmentSlider = (index: number, name: string) => {
    const isVisible = localActiveImageColors.visible[index];

    if (!activeImage) return <></>;

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
              color: rgbToHex(localActiveImageColors.color[index]),
              "&.Mui-checked": {
                color: rgbToHex(localActiveImageColors.color[index]),
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

  return (
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
        {Array(localActiveImageColors.color.length)
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
        {activeImage && localActiveImageColors.color.length > 0 && (
          <Slider
            disabled={!localActiveImageColors.visible[selectedChannelIndex]}
            sx={{
              width: "50%",
              "& .MuiSlider-track": {
                color: (theme) =>
                  localActiveImageColors.visible[selectedChannelIndex]
                    ? rgbToHex(
                        localActiveImageColors.color[selectedChannelIndex],
                      )
                    : theme.palette.action.disabled,
              },
            }}
            value={scaleUpRange(
              localActiveImageColors.range[selectedChannelIndex],
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
  );
};
