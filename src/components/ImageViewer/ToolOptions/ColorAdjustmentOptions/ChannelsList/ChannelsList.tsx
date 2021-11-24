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
import { useDispatch, useSelector } from "react-redux";
import { channelsSelector } from "../../../../../store/selectors/intensityRangeSelector";
import { ChannelType } from "../../../../../types/ChannelType";
import { debounce } from "lodash";
import { imageShapeSelector } from "../../../../../store/selectors/imageShapeSelector";
import { CollapsibleList } from "../../../CategoriesList/CollapsibleList";
import { imageViewerSlice } from "../../../../../store/slices";

type ColorAdjustmentSlidersProp = {
  updateDisplayedValues: (values: Array<Array<number>>) => void;
  displayedValues: Array<Array<number>>;
};

export const ChannelsList = ({
  displayedValues,
  updateDisplayedValues,
}: ColorAdjustmentSlidersProp) => {
  const [open, setOpen] = React.useState(true);

  const dispatch = useDispatch();

  const channels = useSelector(channelsSelector);

  const imageShape = useSelector(imageShapeSelector);

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

  const handler = useCallback(debounce(updateIntensityRanges, 100), [channels]);

  const onCheckboxChanged = (index: number) => () => {
    const current = visibleChannelsIndices.indexOf(index);

    const updated = [...visibleChannelsIndices];

    const copiedChannels = [...channels];

    if (current === -1) {
      updated.push(index);
      copiedChannels[index] = { ...copiedChannels[index], visible: true };
    } else {
      updated.splice(current, 1);
      copiedChannels[index] = { ...copiedChannels[index], visible: false };
    }
    dispatch(
      imageViewerSlice.actions.setChannels({
        channels: copiedChannels,
      })
    );
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
          disabled={!(visibleChannelsIndices.indexOf(index) !== -1)} //TODO style slider when disabled mode
          style={{ width: "60%" }}
          value={displayedValue}
          max={255}
          onChange={(event, value: number | number[]) =>
            handleSliderChange(index, event, value)
          }
          valueLabelDisplay="auto"
          aria-labelledby="range-slider"
        />
      </ListItem>
    );
  };

  const allSliders = (displayedValues: Array<Array<number>>) => {
    if (!imageShape) return;
    const sliders = [];

    const names =
      imageShape.channels === 1 ? ["Grey"] : ["Red", "Green", "Blue"];
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
