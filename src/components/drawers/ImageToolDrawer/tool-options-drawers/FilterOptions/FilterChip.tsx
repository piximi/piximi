import { Chip } from "@mui/material";
import ClearIcon from "@mui/icons-material/Clear";

export const FilterChip = ({
  label,
  color,
  removeFilter,
}: {
  label: string;
  color?: string;
  removeFilter: () => void;
}) => {
  return (
    <Chip
      size="small"
      sx={(theme) => {
        return color
          ? {
              backgroundColor: color,
              color: theme.palette.getContrastText(color),
              "& .MuiChip-deleteIcon": {
                color: theme.palette.getContrastText(color),
              },
            }
          : {};
      }}
      label={label}
      onDelete={removeFilter}
      deleteIcon={<ClearIcon fontSize="small" />}
    />
  );
};
