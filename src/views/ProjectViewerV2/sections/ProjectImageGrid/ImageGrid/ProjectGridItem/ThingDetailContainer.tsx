import { Box, Typography, useTheme } from "@mui/material";
import {
  InfoOutlined as InfoOutlinedIcon,
  Label as LabelIcon,
  LabelImportant as LabelImportantIcon,
} from "@mui/icons-material";

import { ItemDetailTooltip } from "./ItemDetailTooltip";
import { ThingDetailList } from "./ThingDetailList";

import { ImageObject } from "store/dataV2/types";

export const ThingDetailContainer = ({
  position,
  backgroundColor,
  categoryName,
  image,
  usePredictedStyle,
}: {
  position: { top: number; left: number };
  backgroundColor: string;
  categoryName: string;
  image: ImageObject;
  usePredictedStyle: boolean;
}) => {
  const theme = useTheme();

  return (
    <Box
      position="absolute"
      top={position.top + "px"}
      left={position.left + "px"}
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
        contents={
          <ThingDetailList
            image={image}
            color={theme.palette.getContrastText(backgroundColor)}
          />
        }
        backgroundColor={backgroundColor}
      >
        <InfoOutlinedIcon
          sx={{ mt: "8px", ml: "8px", color: backgroundColor }}
        />
      </ItemDetailTooltip>
    </Box>
  );
};
