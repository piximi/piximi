import type { Meta, StoryObj } from "@storybook/react";
import { Box } from "@mui/material";
import { AutoStories } from "@mui/icons-material";
import { CustomIconButton } from "./CustomIconButton";

const meta: Meta<typeof CustomIconButton> = {
  title: "Common/CustomIconButton",
  component: CustomIconButton,
  tags: ["autodocs"],
};

export default meta;

type Story = StoryObj<typeof CustomIconButton>;

const handleClick = () => console.log("I'm clicked");

export const Default: Story = {
  args: {
    onClick: handleClick,
    Icon: AutoStories,
  },
};

export const Disabled: Story = {
  args: {
    Icon: AutoStories,
    onClick: handleClick,
    tooltipText: "Fit Model",
    disabled: true,
  },
};

export const CoupledSize: Story = {
  render: (args) => (
    <Box display="flex">
      <CustomIconButton
        Icon={AutoStories}
        onClick={handleClick}
        tooltipText="Fit Model"
        size="small"
      />
      <CustomIconButton
        Icon={AutoStories}
        onClick={handleClick}
        tooltipText="Fit Model"
        size="medium"
      />
      <CustomIconButton
        Icon={AutoStories}
        onClick={handleClick}
        tooltipText="Fit Model"
        size="large"
      />
    </Box>
  ),
};
