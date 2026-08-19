import { styled } from "@mui/material";
import { RichTreeView, treeItemClasses } from "@mui/x-tree-view";

export const StyledRichTreeView = styled(RichTreeView)(() => ({
  flexGrow: 1,
  maxWidth: "100%",
  overflowY: "auto",
  [`& .${treeItemClasses.content}`]: {
    [`& .${treeItemClasses.label}`]: {
      fontSize: "0.875rem",
    },
    [`& .${treeItemClasses.checkbox}`]: {
      fontSize: "1.25rem",
      "& .MuiSvgIcon-root": {
        fontSize: "1.25rem",
      },
    },
  },
  "& .MuiTreeItem-content.Mui-selected": {
    // Remove the selection background color
    backgroundColor: "transparent",
    // Ensure text color remains default, as Mui-selected often changes text color for contrast
    color: "inherit",

    // Override hover state on selected item
    "&:hover": {
      backgroundColor: "transparent",
    },

    // Override focused state on selected item
    "&.Mui-focused": {
      backgroundColor: "transparent",
    },
  },
})) as typeof RichTreeView;
