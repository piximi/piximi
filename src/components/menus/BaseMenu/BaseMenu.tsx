import { Menu, MenuProps, styled } from "@mui/material";

export const BaseMenu = styled(Menu)<MenuProps>(({ theme }) => ({
  "& .MuiMenu-paper": { minWidth: "10rem" },
}));
