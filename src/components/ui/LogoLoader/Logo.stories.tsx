import React, { useState } from "react";
import type { Meta, StoryObj } from "@storybook/react";

import { LogoLoader } from "./LogoLoader";
import { Box, Button, Slider } from "@mui/material";

const Controller = ({
  width,
  height,
  fullLogo,
}: {
  width: number;
  height: number;
  fullLogo: boolean;
}) => {
  const [loading, setLoading] = useState<boolean>(false);
  const [sliderVal, setSliderVal] = useState(100);

  const flipLoad = () => {
    setLoading((modelStatus) => !modelStatus);
  };

  const handleSlider = (event: Event, newValue: number | number[]) => {
    setSliderVal(newValue as number);
  };

  return (
    <>
      <LogoLoader
        width={width}
        height={height}
        loadPercent={!loading ? -1 : sliderVal / 100}
        fullLogo={fullLogo}
      />
      <div>{sliderVal < 100 ? `Task ${sliderVal} / 100` : ""}</div>
      <Box sx={{ width: 200 }}>
        <div style={{ width: "100%" }}>
          <Button onClick={flipLoad}>Flip Load</Button>
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
