import type { MenuProps } from "@mui/material";
import { Menu, styled } from "@mui/material";

export const BaseMenu = styled(Menu)<MenuProps>(() => ({
  "& .MuiMenu-paper": { minWidth: "10rem" },
}));
