import { styled } from "@mui/material/styles";

import MenuItem, { MenuItemProps } from "@mui/material/MenuItem";

type StyledMenuItemProps = MenuItemProps & { component: string };

export const StyledMenuItem = styled(MenuItem)<StyledMenuItemProps>(() => ({
  maxWidth: 320,
}));
