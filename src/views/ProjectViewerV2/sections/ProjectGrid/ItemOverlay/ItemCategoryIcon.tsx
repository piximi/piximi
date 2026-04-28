import { Box, Tooltip, Typography, useTheme } from "@mui/material";
import {
  Label as LabelIcon,
  LabelImportant as LabelImportantIcon,
} from "@mui/icons-material";

import { haloFilter } from "./halo";

export const ItemCategoryIcon = ({
  backgroundColor,
  categoryName,
  predicted,
}: {
  backgroundColor: string;
  categoryName: string;
  predicted: boolean;
}) => {
  const theme = useTheme();
  const iconHalo = haloFilter(theme.palette.getContrastText(backgroundColor));
  return (
    <Tooltip
      title={
        <Box onClick={(e) => e.stopPropagation()}>
          <Typography
            variant="body2"
            color={theme.palette.getContrastText(backgroundColor)}
          >
            {categoryName}
          </Typography>
        </Box>
      }
      placement="right"
      arrow
      slotProps={{
        tooltip: {
          sx: {
            borderRadius: 2,
            backgroundColor: backgroundColor,
          },
        },
        arrow: {
          sx: {
            color: backgroundColor,
          },
        },
      }}
    >
      {predicted ? (
        <LabelImportantIcon
          sx={{
            mt: "8px",
            ml: "8px",
            color: backgroundColor,
            filter: iconHalo,
          }}
        />
      ) : (
        <LabelIcon
          sx={{
            mt: "8px",
            ml: "8px",
            color: backgroundColor,
            filter: iconHalo,
          }}
        />
      )}
    </Tooltip>
  );
};
