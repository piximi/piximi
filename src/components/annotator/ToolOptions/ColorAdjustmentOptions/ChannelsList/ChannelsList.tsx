import React, { useEffect, useMemo, useState } from "react";
import { batch, useDispatch, useSelector } from "react-redux";
import { debounce } from "lodash";

import {
  Checkbox,
  ListItem,
  ListItemIcon,
  ListItemText,
  Slider,
} from "@mui/material";

import { Palette } from "../Palette";

import { CollapsibleList } from "components/common/CollapsibleList";

import {
  AnnotatorSlice,
  imageShapeSelector,
  activeImageColorsSelector,
  activeImagePlaneSelector,
} from "store/annotator";
import { imageOriginalSrcSelector } from "store/common";

import { Color } from "types";

import {
  convertImageURIsToImageData,
  mapChannelsToSpecifiedRGBImage,
  rgbToHex,
} from "utils/common/imageHelper";

import { CheckboxCheckedIcon, CheckboxUncheckedIcon } from "icons";
import { useLocalGlobalState } from "hooks";

export const ChannelsList = () => {
  const dispatch = useDispatch();

  const imageShape = useSelector(imageShapeSelector);

  const activeImagePlane = useSelector(activeImagePlaneSelector);

  const originalSrc = useSelector(imageOriginalSrcSelector);

  const {
    localState: localActiveImageColors,
    setLocalState: setLocalActiveImageColors,
    dispatchState: dispatchActiveImageColors,
  } = useLocalGlobalState(
    activeImageColorsSelector,
    AnnotatorSlice.actions.setImageColors,
    []
  );

  const [visibleChannelsIdxs, setVisibleChannelsIdxs] = useState<Array<number>>(
    []
  );

  useEffect(() => {
    setVisibleChannelsIdxs(
      localActiveImageColors
        .map((channel: Color) => channel.visible)
        .reduce((c: Array<number>, v, i) => (v ? c.concat(i) : c), [])
    );
  }, [localActiveImageColors]);

  const handleSliderChange = useMemo(
    () =>
      debounce((idx: number, event: any, newValue: [number, number]) => {
        setLocalActiveImageColors((curr) => {
          return curr.map((channel: Color, i: number) => {
            return i === idx ? { ...channel, range: newValue } : channel;
          });
        });
      }, 16),
    [setLocalActiveImageColors]
  );

  const handleSliderChangeCommitted = async () => {
    if (!originalSrc || !imageShape) return;

    const originalData = await convertImageURIsToImageData(
      new Array(originalSrc[activeImagePlane])
    );

    const modifiedURI = mapChannelsToSpecifiedRGBImage(
      originalData[0],
      localActiveImageColors,
      imageShape.height,
      imageShape.width
    );
    batch(() => {
      dispatch(AnnotatorSlice.actions.setImageSrc({ src: modifiedURI }));
      dispatchActiveImageColors({
        colors: localActiveImageColors,
        execSaga: true,
      });
    });
  };

  const onCheckboxChanged = (index: number) => () => {
    const current = visibleChannelsIdxs.indexOf(index);

    const visibleChannels = [...visibleChannelsIdxs];

    const copiedChannels = [...localActiveImageColors];

    if (current === -1) {
      visibleChannels.push(index);
      copiedChannels[index] = { ...copiedChannels[index], visible: true };
    } else {
      visibleChannels.splice(current, 1);
      copiedChannels[index] = { ...copiedChannels[index], visible: false };
    }

    batch(async () => {
      dispatch(
        AnnotatorSlice.actions.setImageColors({
          colors: copiedChannels,
          execSaga: true,
        })
      );

      if (!originalSrc || !imageShape) return;

      const originalData = await convertImageURIsToImageData(
        new Array(originalSrc[activeImagePlane])
      );

      const arrayLength = originalData[0][0].length;
      const modifiedData = originalData[0].map(
        (arr: Array<number>, i: number) => {
          if (visibleChannels.includes(i)) {
            return arr;
          } else {
            return new Array(arrayLength).fill(0);
          }
        }
      );

      const modifiedURI = mapChannelsToSpecifiedRGBImage(
        modifiedData,
        copiedChannels,
        imageShape.height,
        imageShape.width
      );

      dispatch(AnnotatorSlice.actions.setImageSrc({ src: modifiedURI }));
    });
  };

  const colorAdjustmentSlider = (index: number, name: string) => {
    const isVisible = visibleChannelsIdxs.indexOf(index) !== -1;

    return (
      <ListItem dense key={index}>
        <ListItemIcon>
          <Checkbox
            onClick={onCheckboxChanged(index)}
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
                  ? rgbToHex(localActiveImageColors[index].color)
                  : theme.palette.action.disabled,
            },
          }}
          value={localActiveImageColors[index].range}
          max={255}
          onChange={(event, value: number | number[]) =>
            handleSliderChange(index, event, value as [number, number])
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
      {Array(localActiveImageColors.length)
        .fill(0)
        .map((_, i) => {
          return colorAdjustmentSlider(i, `Ch. ${i}`);
        })}
    </CollapsibleList>
  );
};
