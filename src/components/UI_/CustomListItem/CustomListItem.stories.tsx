import type { Meta, StoryObj } from "@storybook/react";
import { CustomListItem } from "./CustomListItem";
import { List } from "@mui/material";
import MenuBookIcon from "@mui/icons-material/MenuBook";

const meta: Meta<typeof CustomListItem> = {
  title: "Common/CustomListItem",
  component: CustomListItem,
  tags: ["autodocs"],
};

export default meta;

type Story = StoryObj<typeof CustomListItem>;

export const Default: Story = {
  args: {
    primaryText: "List Item",
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
