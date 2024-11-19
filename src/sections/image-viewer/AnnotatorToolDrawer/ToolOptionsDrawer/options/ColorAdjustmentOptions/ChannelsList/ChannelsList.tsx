import React, { useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import produce from "immer";
import { tensor2d } from "@tensorflow/tfjs";
import { debounce } from "lodash";

import {
  Checkbox,
  ListItem,
  ListItemIcon,
  ListItemText,
  Slider,
} from "@mui/material";

import { useLocalGlobalState } from "hooks";

import { CollapsibleList } from "components/CollapsibleList";
import { Palette } from "../Palette";

import {
  selectActiveImage,
  selectActiveImageRawColor,
} from "store/imageViewer/reselectors";
import { dataSlice } from "store/data/dataSlice";
import { scaleDownRange, scaleUpRange } from "utils/common/helpers";
import { BitDepth } from "utils/file-io/types";
import { rgbToHex } from "utils/common/helpers";
import { CheckboxCheckedIcon, CheckboxUncheckedIcon } from "icons";

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
    dataSlice.actions.updateThings,
    {
      range: {},
      visible: {},
      color: [],
    }
  );

  const handleSliderChange = useMemo(
    () =>
      debounce(
        (idx: number, newValue: [number, number], bitDepth: BitDepth) => {
          setLocalActiveImageColors(
            produce((draftColor) => {
              draftColor.range[idx] = scaleDownRange(newValue, bitDepth);
            })
          );
        },
        10
      ),
    [setLocalActiveImageColors]
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
      dataSlice.actions.updateThings({
        updates: [{ id: activeImage!.id, colors: newColors }],
      })
    );
  };

  const colorAdjustmentSlider = (index: number, name: string) => {
    const isVisible = localActiveImageColors.visible[index];

    if (!activeImage) return <></>;

    return (
      <ListItem dense key={index}>
        <ListItemIcon>
          <Checkbox
            onChange={(event) => onCheckboxChanged(index, event.target.checked)}
            checked={isVisible}
            disableRipple
            edge="start"
            icon={<CheckboxUncheckedIcon />}
            checkedIcon={<CheckboxCheckedIcon />}
            tabIndex={-1}
          />
        </ListItemIcon>
        <ListItemText primary={name} />
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
            activeImage.bitDepth
          )}
          max={2 ** activeImage.bitDepth - 1}
          onChange={(event, value: number | number[]) =>
            handleSliderChange(
              index,
              value as [number, number],
              activeImage.bitDepth
            )
          }
          onChangeCommitted={handleSliderChangeCommitted}
          valueLabelDisplay="auto"
          aria-labelledby="range-slider"
        />
        <Palette channelIdx={index} />
      </ListItem>
    );
  };

  return (
    <CollapsibleList closed dense primary="Channels">
      {Array(localActiveImageColors.color.length)
        .fill(0)
        .map((_, i) => {
          return colorAdjustmentSlider(i, `Ch. ${i}`);
        })}
    </CollapsibleList>
  );
};
