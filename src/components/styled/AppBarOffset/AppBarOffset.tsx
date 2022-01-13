import { styled } from "@mui/material";

/*
This styled component is mostly for addressing fixed placement of AppBar components
see: https://mui.com/components/app-bar/#fixed-placement
*/

export const AppBarOffset = styled("div")(({ theme }) => theme.mixins.toolbar);
