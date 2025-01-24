import { Box, BoxProps, styled } from "@mui/material";

export const FlexColumnBox = styled(Box)<BoxProps>(() => ({
  display: "flex",
  flexDirection: "column",
}));
