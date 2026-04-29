import { useMemo } from "react";

import type { ChipProps } from "@mui/material";
import { Chip, useTheme } from "@mui/material";
import { Close as CloseIcon } from "@mui/icons-material";

export const FilterChip = ({
  label,
  color: suggestedColor,
  isFiltered,
  ...chipProps
}: {
  label: string;
  color: string | undefined;
  isFiltered: boolean;
} & Omit<ChipProps, "color">) => {
  const theme = useTheme();
  const color = useMemo(
    () => suggestedColor ?? theme.palette.primary.main,
    [suggestedColor, theme],
  );
  return (
    <Chip
      size="small"
      sx={(theme) => ({
        backgroundColor: color,
        borderColor: color,
        borderWidth: "2px",
        borderStyle: "solid",
        color: theme.palette.getContrastText(color),
        transition: "all 0.2s ease-in-out",
        "&:hover": {
          bgcolor: color,
          borderColor: theme.palette.text.primary,
          cursor: isFiltered ? "default" : "pointer",
        },
        "& .MuiChip-deleteIcon": {
          color: isFiltered ? "inherit" : theme.palette.getContrastText(color),
          transition: "all 0.2s ease-in-out",
          "&:hover": {
            color: isFiltered
              ? "inherit"
              : theme.palette.getContrastText(color),
          },
        },
      })}
      label={label}
      onClick={chipProps?.onClick}
      onDelete={chipProps?.onDelete}
      deleteIcon={isFiltered ? <CloseIcon fontSize="small" /> : undefined}
      {...chipProps}
    />
  );
};
