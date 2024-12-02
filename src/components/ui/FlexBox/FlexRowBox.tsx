import { Box, BoxProps, styled } from "@mui/material";

export const FlexRowBox = styled(Box)<BoxProps>(({ theme }) => ({
  display: "flex",
  flexDirection: "row",
}));
