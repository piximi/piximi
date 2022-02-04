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
import { Color } from "../../../../../types/Color";
import { debounce } from "lodash";
import { imageShapeSelector } from "../../../../../store/selectors/imageShapeSelector";
import { CollapsibleList } from "../../../CategoriesList/CollapsibleList";
import { imageViewerSlice } from "../../../../../store/slices";
import { activeImagePlaneSelector } from "../../../../../store/selectors/activeImagePlaneSelector";
import {
  mapChannelstoSpecifiedRGBImage,
  rgbToHex,
} from "../../../../../image/imageHelper";
import { Palette } from "../Palette";
import { activeImageColorsSelector } from "../../../../../store/selectors/activeImageColorsSelector";

type ChannelsListProps = {
  originalData: Array<Array<Array<number>>>;
};

export const ChannelsList = ({ originalData }: ChannelsListProps) => {
  const dispatch = useDispatch();

  const activeImageColors = useSelector(activeImageColorsSelector);

  const imageShape = useSelector(imageShapeSelector);

  const activeImagePlane = useSelector(activeImagePlaneSelector);

  const visibleChannelsIndices = activeImageColors
    .map((channel: Color, idx) => channel.visible)
    .reduce((c: Array<number>, v, i) => (v ? c.concat(i) : c), []);

  const handleSliderChange = (
    idx: number,
    event: any,
    newValue: number | number[]
  ) => {
    const oldValues = activeImageColors.map((channel: Color, i: number) => {
      if (i === idx) {
        return newValue as Array<number>;
      } else {
        return channel.range;
      }
    });
    handler(oldValues);
  };

  const handler = useCallback(
    (values: Array<Array<number>>) => {
      const updateIntensityRanges = (values: Array<Array<number>>) => {
        const copiedValues = [...values].map((range: Array<number>) => {
          return [...range];
        });

        const updatedChannels = activeImageColors.map(
          (channel: Color, index: number) => {
            return { ...channel, range: copiedValues[index] };
          }
        );

        dispatch(
          imageViewerSlice.actions.setImageColors({
            colors: updatedChannels,
          })
        );
      };
      updateIntensityRanges(values);
      return debounce(updateIntensityRanges, 100);
    },
    [activeImageColors, dispatch]
  );

  const handleSliderChangeCommitted = () => {
    if (!originalData || !imageShape) return;

    const modifiedURI = mapChannelstoSpecifiedRGBImage(
      originalData[activeImagePlane],
      activeImageColors,
      imageShape.height,
      imageShape.width
    );
    batch(() => {
      dispatch(imageViewerSlice.actions.setImageSrc({ src: modifiedURI }));
    });
  };

  const onCheckboxChanged = (index: number) => () => {
    const current = visibleChannelsIndices.indexOf(index);

    const visibles = [...visibleChannelsIndices];

    const copiedChannels = [...activeImageColors];

    if (current === -1) {
      visibles.push(index);
      copiedChannels[index] = { ...copiedChannels[index], visible: true };
    } else {
      visibles.splice(current, 1);
      copiedChannels[index] = { ...copiedChannels[index], visible: false };
    }

    batch(() => {
      dispatch(
        imageViewerSlice.actions.setImageColors({
          colors: copiedChannels,
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

  const colorAdjustmentSlider = (index: number, name: string) => {
    return (
      <ListItem dense key={index}>
        <ListItemIcon>
          <Checkbox
            onClick={onCheckboxChanged(index)}
            checked={visibleChannelsIndices.indexOf(index) !== -1}
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
          disabled={!(visibleChannelsIndices.indexOf(index) !== -1)} //TODO #142 style slider when disabled mode
          sx={{
            width: "50%",
            "& .MuiSlider-track": {
              color: rgbToHex(activeImageColors[index].color),
            },
          }}
          value={activeImageColors[index].range}
          max={255}
          onChange={(event, value: number | number[]) =>
            handleSliderChange(index, event, value)
          }
          onChangeCommitted={handleSliderChangeCommitted}
          valueLabelDisplay="auto"
          aria-labelledby="range-slider"
        />
        <Palette originalData={originalData} channelIdx={index} />
      </ListItem>
    );
  };

  return (
    <CollapsibleList closed dense primary="Channels">
      {Array(activeImageColors.length)
        .fill(0)
        .map((_, i) => {
          return colorAdjustmentSlider(i, `Ch. ${i}`);
        })}
    </CollapsibleList>
  );
};
