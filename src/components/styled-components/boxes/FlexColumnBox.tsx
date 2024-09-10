import { Box, BoxProps, styled } from "@mui/material";

export const FlexColumnBox = styled(Box)<BoxProps>(({ theme }) => ({
  display: "flex",
  flexDirection: "column",
}));
