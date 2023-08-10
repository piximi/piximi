import React from "react";
import type { Meta, StoryObj } from "@storybook/react";

import { Logo } from "./Logo";
import { Button } from "@mui/material";
import { useDispatch, useSelector } from "react-redux";
import {
  classifierModelStatusSelector,
  classifierSlice,
} from "store/classifier";
import { ModelStatus } from "types/ModelType";

const Controller = ({ width, height }: { width: number; height: number }) => {
  const dispatch = useDispatch();
  const modelStatus = useSelector(classifierModelStatusSelector);

  const flipLoad = (newStatus: ModelStatus) => {
    dispatch(
      classifierSlice.actions.updateModelStatus({
        modelStatus: newStatus,
        execSaga: false,
      })
    );
  };

  return (
    <>
      <Logo
        width={width}
        height={height}
        loadPercent={modelStatus === ModelStatus.Predicting ? -1 : 1}
      />
      <div style={{ width: "100%" }}>
        <Button
          onClick={() =>
            flipLoad(
              modelStatus === ModelStatus.Predicting
                ? ModelStatus.Trained
                : ModelStatus.Predicting
            )
          }
        >
          Flip Load
        </Button>
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
