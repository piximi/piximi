import { ListItem } from "@mui/material";
import ListItemText from "@mui/material/ListItemText";
import React, { useCallback } from "react";
import Slider from "@mui/material/Slider";
import ListItemIcon from "@mui/material/ListItemIcon";
import Checkbox from "@mui/material/Checkbox";
import {
  CheckboxCheckedIcon,
  CheckboxUncheckedIcon,
} from "../../../../../icons";
import { batch, useDispatch, useSelector } from "react-redux";
import { channelsSelector } from "../../../../../store/selectors/intensityRangeSelector";
import { ChannelType } from "../../../../../types/ChannelType";
import { debounce } from "lodash";
import { imageShapeSelector } from "../../../../../store/selectors/imageShapeSelector";
import { CollapsibleList } from "../../../CategoriesList/CollapsibleList";
import { imageViewerSlice } from "../../../../../store/slices";
import { imageOriginalSrcSelector } from "../../../../../store/selectors";
import { activeImagePlaneSelector } from "../../../../../store/selectors/activeImagePlaneSelector";
import { mapChannelstoSpecifiedRGBImage } from "../../../../../image/imageHelper";
import { Palette } from "../Palette";

type ColorAdjustmentSlidersProp = {
  updateDisplayedValues: (values: Array<Array<number>>) => void;
  displayedValues: Array<Array<number>>;
};

export const ChannelsList = ({
  displayedValues,
  updateDisplayedValues,
}: ColorAdjustmentSlidersProp) => {
  const dispatch = useDispatch();

  const channels = useSelector(channelsSelector);

  const imageShape = useSelector(imageShapeSelector);

  const originalData = useSelector(imageOriginalSrcSelector);

  const activeImagePlane = useSelector(activeImagePlaneSelector);

  const visibleChannelsIndices = channels
    .map((channel: ChannelType, idx) => channel.visible)
    .reduce((c: Array<number>, v, i) => (v ? c.concat(i) : c), []);

  const handleSliderChange = (
    idx: number,
    event: any,
    newValue: number | number[]
  ) => {
    const copiedValues = [...displayedValues].map((range: Array<number>) => {
      return [...range];
    });
    copiedValues[idx] = newValue as Array<number>;
    updateDisplayedValues(copiedValues);
    handler(copiedValues);
  };

  const handler = useCallback(
    (values: Array<Array<number>>) => {
      const updateIntensityRanges = (values: Array<Array<number>>) => {
        const copiedValues = [...values].map((range: Array<number>) => {
          return [...range];
        });

        const updatedChannels = channels.map(
          (channel: ChannelType, index: number) => {
            return { ...channel, range: copiedValues[index] };
          }
        );

        dispatch(
          imageViewerSlice.actions.setChannels({
            channels: updatedChannels,
          })
        );
      };
      updateIntensityRanges(values);
      return debounce(updateIntensityRanges, 100);
    },
    [channels, dispatch]
  );

  const handleSliderChangeCommitted = () => {
    if (!originalData || !imageShape) return;

    const modifiedURI = mapChannelstoSpecifiedRGBImage(
      originalData[activeImagePlane],
      channels,
      imageShape.height,
      imageShape.width
    );
    dispatch(imageViewerSlice.actions.setImageSrc({ src: modifiedURI }));
  };

  const onCheckboxChanged = (index: number) => () => {
    const current = visibleChannelsIndices.indexOf(index);

    const visibles = [...visibleChannelsIndices];

    const copiedChannels = [...channels];

    if (current === -1) {
      visibles.push(index);
      copiedChannels[index] = { ...copiedChannels[index], visible: true };
    } else {
      visibles.splice(current, 1);
      copiedChannels[index] = { ...copiedChannels[index], visible: false };
    }

    batch(() => {
      dispatch(
        imageViewerSlice.actions.setChannels({
          channels: copiedChannels,
        })
      );

      if (!originalData || !imageShape) return;

      const arrayLength = originalData[activeImagePlane][0].length;
      const modifiedData = originalData[activeImagePlane].map(
        (arr: Array<number>, i: number) => {
          if (visibles.includes(i)) {
            return arr;
          } else {
            return new Array(arrayLength).fill(0);
          }
        }
      );

      const modifiedURI = mapChannelstoSpecifiedRGBImage(
        modifiedData,
        copiedChannels,
        imageShape.height,
        imageShape.width
      );

      dispatch(imageViewerSlice.actions.setImageSrc({ src: modifiedURI }));
    });
  };

  const colorAdjustmentSlider = (
    index: number,
    name: string,
    displayedValue: Array<number>
  ) => {
    return (
      <ListItem dense key={index}>
        <ListItemIcon>
          <Checkbox
            onClick={onCheckboxChanged(index)}
            checked={visibleChannelsIndices.indexOf(index) !== -1}
            disableRipple
            edge="start"
            icon={
              <>
                <CheckboxUncheckedIcon />
              </>
            }
            checkedIcon={
              <>
                <CheckboxCheckedIcon />
              </>
            }
            tabIndex={-1}
          />
        </ListItemIcon>
        <ListItemText primary={name} />
        <Slider
          key={index}
          disabled={!(visibleChannelsIndices.indexOf(index) !== -1)} //TODO #142 style slider when disabled mode
          sx={{ width: "50%" }}
          value={displayedValue}
          max={255}
          onChange={(event, value: number | number[]) =>
            handleSliderChange(index, event, value)
          }
          onChangeCommitted={handleSliderChangeCommitted}
          valueLabelDisplay="auto"
          aria-labelledby="range-slider"
        />
        <Palette channelIdx={index} />
      </ListItem>
    );
  };

  const allSliders = (displayedValues: Array<Array<number>>) => {
    if (!imageShape) return;
    const sliders = [];

    const names: Array<string> = [];

    for (let i = 0; i < imageShape.channels; i++) {
      names.push(`Ch. ${i}`);
    }

    for (let i = 0; i < imageShape.channels; i++) {
      sliders.push(colorAdjustmentSlider(i, names[i], displayedValues[i]));
    }
    return sliders;
  };

  return (
    <CollapsibleList closed dense primary="Channels">
      {allSliders(displayedValues)}
    </CollapsibleList>
  );
};
