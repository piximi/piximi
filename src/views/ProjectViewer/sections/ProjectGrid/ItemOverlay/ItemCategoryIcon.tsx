import { useMemo } from "react";

import {
  Box,
  darken,
  lighten,
  Tooltip,
  Typography,
  useTheme,
} from "@mui/material";
import {
  Label as LabelIcon,
  LabelImportant as LabelImportantIcon,
} from "@mui/icons-material";

import { haloFilter } from "utils/styleUtils";

export const ItemCategoryIcon = ({
  backgroundColor,
  categoryName,
  predicted,
}: {
  backgroundColor: string;
  categoryName: string;
  predicted: number | undefined;
}) => {
  const theme = useTheme();

  const iconHalo = useMemo(() => {
    const contrastColor = theme.palette.getContrastText(backgroundColor);
    const augmenter = contrastColor === "#fff" ? lighten : darken;
    return haloFilter(augmenter(backgroundColor, 0.6));
  }, [theme, backgroundColor]);
  return (
    <Tooltip
      title={
        <Box onClick={(e) => e.stopPropagation()}>
          <Typography
            variant="body2"
            color={theme.palette.getContrastText(backgroundColor)}
          >
            {`${categoryName}${predicted !== undefined ? " -- " + Math.floor(predicted * 100) + "%" : ""}`}
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
      {predicted !== undefined ? (
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
