import { useMemo } from "react";
import { tensor2d } from "@tensorflow/tfjs";
import { produce } from "immer";
import { debounce } from "lodash";
import { useDispatch, useSelector } from "react-redux";
import {
  Checkbox,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Slider,
} from "@mui/material";

import { useLocalGlobalState } from "hooks";

import { Palette } from "./Palette";

import { annotatorSlice } from "views/ImageViewer/state/annotator";
import {
  selectActiveImage,
  selectActiveImageRawColor,
} from "views/ImageViewer/state/imageViewer/reselectors";

import { rgbToHex } from "utils/colorUtils";
import { scaleDownRange, scaleUpRange } from "utils/dataUtils";

import { BitDepth } from "store/data/types";

//TODO: Slider Components

export const ChannelsList = () => {
  const dispatch = useDispatch();
  const activeImage = useSelector(selectActiveImage);

  const {
    localState: localActiveImageColors,
    setLocalState: setLocalActiveImageColors,
    dispatchState: dispatchActiveImageColors,
  } = useLocalGlobalState(
    selectActiveImageRawColor,
    annotatorSlice.actions.editThings,
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
    dispatchActiveImageColors({
      updates: [
        {
          id: activeImage!.id,
          colors: {
            ...localActiveImageColors,
            color: tensor2d(localActiveImageColors.color),
          },
        },
      ],
    });
  };

  const onCheckboxChanged = (index: number, enabled: boolean) => {
    const newColors = {
      visible: { ...localActiveImageColors.visible }, // copy so we can modify
      range: localActiveImageColors.range,
      color: tensor2d(localActiveImageColors.color),
    };
    newColors.visible[index] = enabled;

    dispatch(
      annotatorSlice.actions.editThings({
        updates: [{ id: activeImage!.id, colors: newColors }],
      }),
    );
  };

  const colorAdjustmentSlider = (index: number, name: string) => {
    const isVisible = localActiveImageColors.visible[index];

    return (
      <ListItem dense key={index}>
        <ListItemIcon>
          <Checkbox
            onChange={(event) => onCheckboxChanged(index, event.target.checked)}
            checked={isVisible}
            disableRipple
            edge="start"
            tabIndex={-1}
          />
        </ListItemIcon>
        <ListItemText primary={name} sx={{ mr: 1 }} />
        <Slider
          key={index}
          disabled={!isVisible}
          sx={{
            width: "50%",
            "& .MuiSlider-track": {
              color: (theme) =>
                isVisible
                  ? rgbToHex(localActiveImageColors.color[index])
                  : theme.palette.action.disabled,
            },
          }}
          value={scaleUpRange(
            localActiveImageColors.range[index],
            activeImage!.bitDepth,
          )}
          max={2 ** activeImage!.bitDepth - 1}
          onChange={(event, value: number | number[]) =>
            handleSliderChange(
              index,
              value as [number, number],
              activeImage!.bitDepth,
            )
          }
          onChangeCommitted={handleSliderChangeCommitted}
          valueLabelDisplay="auto"
          aria-labelledby="range-slider"
          size="small"
        />
        <Palette channelIdx={index} />
      </ListItem>
    );
  };
  return activeImage ? (
    <List dense>
      {Array(localActiveImageColors.color.length)
        .fill(0)
        .map((_, i) => {
          return colorAdjustmentSlider(i, `Ch. ${i + 1}`);
        })}
    </List>
  ) : (
    <></>
  );
};
