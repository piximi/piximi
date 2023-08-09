import React, { useState } from "react";
import type { Meta, StoryObj } from "@storybook/react";

import { Logo } from "./Logo";
import { Button } from "@mui/material";

const Controller = ({ width, height }: { width: number; height: number }) => {
  const [loadPercent, setLoadPercent] = useState(1);

  const flipLoad = () => {
    setLoadPercent((prev) => (prev > 0 ? -1 : 1));
  };

  return (
    <>
      <Logo width={width} height={height} loadPercent={loadPercent} />
      <div style={{ width: "100%" }}>
        <Button onClick={flipLoad}>Flip Load</Button>
      </div>
    </>
  );
};

const meta: Meta<typeof Controller> = {
  title: "Example/Logo",
  component: Controller,
  tags: ["autodocs"],
};

export default meta;

type Story = StoryObj<typeof Controller>;

export const Playground: Story = {
  args: {
    width: 1000,
    height: 200,
  },
};
