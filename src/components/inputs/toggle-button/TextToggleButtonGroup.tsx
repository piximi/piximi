import { styled, ToggleButtonGroup } from "@mui/material";

// Custom styled ToggleButton to mimic the 'text' variant of a Button.
export const TextToggleButtonGroup = styled(ToggleButtonGroup)(() => ({
  // 1. Core styles: Remove borders and background
  border: "none",
  boxShadow: "none",
}));
