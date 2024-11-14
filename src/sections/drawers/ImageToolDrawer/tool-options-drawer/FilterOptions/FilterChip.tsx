import { Chip } from "@mui/material";
import VisibilityOutlinedIcon from "@mui/icons-material/VisibilityOutlined";
import VisibilityOffOutlinedIcon from "@mui/icons-material/VisibilityOffOutlined";

export const FilterChip = ({
  label,
  color,
  toggleFilter,
  isFiltered,
}: {
  label: string;
  color?: string;
  toggleFilter: () => void;
  isFiltered: boolean;
}) => {
  return (
    <Chip
      size="small"
      sx={(theme) => {
        return color
          ? {
              backgroundColor: isFiltered ? "transparent" : color,
              borderColor: color ?? theme.palette.background.paper,
              borderWidth: "1px",
              borderStyle: "solid",
              color: isFiltered
                ? "inherit"
                : theme.palette.getContrastText(color),
              "& .MuiChip-deleteIcon": {
                color: isFiltered
                  ? "inherit"
                  : theme.palette.getContrastText(color),
              },
            }
          : {};
      }}
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
