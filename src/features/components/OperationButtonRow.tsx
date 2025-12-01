import { Box, BoxProps, styled } from "@mui/material";

export const OperationButtonRow = styled(Box)<BoxProps>(() => ({
  display: "flex",
  flexDirection: "row",
  justifyContent: "space-between",
  alignItems: "center",
  width: "100%",
  px: 2,
}));
