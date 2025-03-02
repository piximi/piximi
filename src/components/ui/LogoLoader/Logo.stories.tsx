import React, { useState } from "react";
import type { Meta, StoryObj } from "@storybook/react";

import { LogoLoader } from "./LogoLoader";
import { Box, Button, Slider } from "@mui/material";
import { useDispatch, useSelector } from "react-redux";
import { classifierSlice } from "store/classifier";
import { ModelStatus } from "utils/models/enums";
import { selectActiveClassifierModelStatus } from "store/classifier/reselectors";
import { selectActiveKindId } from "store/project/selectors";

const Controller = ({
  width,
  height,
  fullLogo,
}: {
  width: number;
  height: number;
  fullLogo: boolean;
}) => {
  const dispatch = useDispatch();
  const modelStatus = useSelector(selectActiveClassifierModelStatus);
  const activeKindId = useSelector(selectActiveKindId);
  const [sliderVal, setSliderVal] = useState(100);

  const flipLoad = (newStatus: ModelStatus) => {
    dispatch(
      classifierSlice.actions.updateModelStatus({
        kindId: activeKindId,
        modelStatus: newStatus,
      }),
    );
  };

  const handleSlider = (event: Event, newValue: number | number[]) => {
    setSliderVal(newValue as number);
  };

  return (
    <>
      <LogoLoader
        width={width}
        height={height}
        loadPercent={
          modelStatus === ModelStatus.Predicting ? -1 : sliderVal / 100
        }
        fullLogo={fullLogo}
      />
      <div>{sliderVal < 100 ? `Task ${sliderVal} / 100` : ""}</div>
      <Box sx={{ width: 200 }}>
        <div style={{ width: "100%" }}>
          <Button
            onClick={() =>
              flipLoad(
                modelStatus === ModelStatus.Predicting
                  ? ModelStatus.Trained
                  : ModelStatus.Predicting,
              )
            }
          >
            Flip Load
          </Button>
        </div>
        <Slider value={sliderVal} onChange={handleSlider} />
      </Box>
    </>
  );
};

const meta: Meta<typeof Controller> = {
  title: "Example/LogoLoader",
  component: Controller,
  tags: ["autodocs"],
};

export default meta;

type Story = StoryObj<typeof Controller>;

export const Playground: Story = {
  args: {
    width: 1000,
    height: 200,
    fullLogo: true,
  },
};
