import { Chip } from "@mui/material";

import {
  VisibilityOutlined as VisibilityOutlinedIcon,
  VisibilityOffOutlined as VisibilityOffOutlinedIcon,
} from "@mui/icons-material";

export const FilterChip = ({
  label,
  color,
  toggleFilter,
  isFiltered,
}: {
  label: string;
  color: string;
  toggleFilter: () => void;
  isFiltered: boolean;
}) => {
  return (
    <Chip
      size="small"
      sx={(theme) => ({
        backgroundColor: isFiltered ? "transparent" : color,
        borderColor: color,
        borderWidth: "2px",
        borderStyle: "solid",
        color: isFiltered ? "inherit" : theme.palette.getContrastText(color),
        transition: "all 0.2s ease-in-out",
        "&:hover": {
          backgroundColor: isFiltered ? "transparent" : color,
          borderColor: theme.palette.text.primary,
        },
        "& .MuiChip-deleteIcon": {
          color: isFiltered ? "inherit" : theme.palette.getContrastText(color),
          transition: "all 0.2s ease-in-out",
        },
      })}
      label={label}
      onClick={toggleFilter}
      onDelete={toggleFilter}
      deleteIcon={
        isFiltered ? (
          <VisibilityOffOutlinedIcon fontSize="small" />
        ) : (
          <VisibilityOutlinedIcon fontSize="small" />
        )
      }
    />
  );
};
