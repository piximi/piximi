import type { ReactNode } from "react";

import { Box, Typography, useTheme } from "@mui/material";
import {
  InfoOutlined as InfoOutlinedIcon,
  Label as LabelIcon,
  LabelImportant as LabelImportantIcon,
} from "@mui/icons-material";

import { ItemDetailTooltip } from "./ItemDetailTooltip";

export const ItemDetailContainer = ({
  position,
  backgroundColor,
  categoryName,
  usePredictedStyle,
  renderDetailList,
}: {
  position: { top: string; left: string };
  backgroundColor: string;
  categoryName: string;
  usePredictedStyle: boolean;
  renderDetailList: (color: string) => ReactNode;
}) => {
  const theme = useTheme();

  return (
    <Box
      position="absolute"
      top={position.top}
      left={position.left}
      color={theme.palette.getContrastText(backgroundColor)}
    >
      <ItemDetailTooltip
        contents={
          <Typography
            variant="body2"
            color={theme.palette.getContrastText(backgroundColor)}
          >
            {categoryName}
          </Typography>
        }
        backgroundColor={backgroundColor}
      >
        {usePredictedStyle ? (
          <LabelImportantIcon
            sx={{ mt: "8px", ml: "8px", color: backgroundColor }}
          />
        ) : (
          <LabelIcon sx={{ mt: "8px", ml: "8px", color: backgroundColor }} />
        )}
      </ItemDetailTooltip>

      <Box sx={{ flexGrow: 1 }} />

      <ItemDetailTooltip
        contents={renderDetailList(
          theme.palette.getContrastText(backgroundColor),
        )}
        backgroundColor={backgroundColor}
      >
        <InfoOutlinedIcon
          sx={{ mt: "8px", ml: "8px", color: backgroundColor }}
        />
      </ItemDetailTooltip>
    </Box>
  );
};
