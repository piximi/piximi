import { Stack, StackProps, styled } from "@mui/material";

export const ButtonContainer = styled(Stack)<StackProps>(() => ({
  alignItems: "flex-start",
  width: "100%",
  gap: 1,
}));
