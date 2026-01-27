import { styled, ToggleButton, toggleButtonClasses } from "@mui/material";

// Custom styled ToggleButton to mimic the 'text' variant of a Button.
export const TextToggleButton = styled(ToggleButton)(({ theme }) => ({
  // 1. Core styles: Remove borders and background
  border: "none",
  backgroundColor: "transparent",
  // Use text color from theme, but ensure it's slightly noticeable
  color: theme.palette.text.secondary,
  padding: theme.spacing(0, 0.5),
  borderRadius: theme.shape.borderRadius,

  // 2. Handle component relationships in the group
  [`&.${toggleButtonClasses.root}`]: {
    // Remove the default vertical separator from the ToggleButtonGroup
    "&:not(:first-of-type)": {
      borderLeft: "none",
      marginLeft: theme.spacing(0.5), // Add small gap for visual separation
    },
    // Ensure the first button also doesn't have the default group border
    "&:first-of-type": {
      borderLeft: "none",
    },
  },

  // 3. Hover state: Use standard action hover background
  "&:hover": {
    backgroundColor: theme.palette.action.hover,
    border: "none", // Ensure hover doesn't re-introduce border
  },

  // 4. Selected state: Mimics the color and slight background of a selected text button
  "&.Mui-selected": {
    // Primary color for selected text
    color: theme.palette.primary.main,
    // Light background for selection
    backgroundColor: "transparent",
    borderBottom: `1px solid ${theme.palette.primary.main}`,
    borderRadius: 0,

    // Ensure selected state maintains hover effect specificity
    "&:hover": {
      backgroundColor: "transparent",
    },
  },
}));
