import type { Meta, StoryObj } from "@storybook/react";
import { CustomListItemButton } from "./CustomListItemButton";
import { List } from "@mui/material";
import MenuBookIcon from "@mui/icons-material/MenuBook";

const meta: Meta<typeof CustomListItemButton> = {
  title: "Common/CustomListItemButton",
  component: CustomListItemButton,
  tags: ["autodocs"],
};

export default meta;

type Story = StoryObj<typeof CustomListItemButton>;

export const Default: Story = {
  args: {
    primaryText: "List Item",
    onClick: () => {},
  },
  decorators: [
    (Story) => (
      <List sx={{ width: 300 }}>
        <Story />
      </List>
    ),
  ],
};

export const WithIcon: Story = {
  args: {
    primaryText: "List Item With Icon",
    onClick: () => {},
    icon: <MenuBookIcon />,
  },
  decorators: [
    (Story) => (
      <List sx={{ width: 300 }}>
        <Story />
      </List>
    ),
  ],
};

export const WithToolTip: Story = {
  args: {
    primaryText: "List Item With Tooltip",
    onClick: () => {},
    tooltipText: "This has a tooltip",
  },
  decorators: [
    (Story) => (
      <List sx={{ width: 300 }}>
        <Story />
      </List>
    ),
  ],
};
