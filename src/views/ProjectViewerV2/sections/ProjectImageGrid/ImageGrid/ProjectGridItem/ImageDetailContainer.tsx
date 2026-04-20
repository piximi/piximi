import { Box, Typography, useTheme } from "@mui/material";
import {
  InfoOutlined as InfoOutlinedIcon,
  Label as LabelIcon,
  LabelImportant as LabelImportantIcon,
} from "@mui/icons-material";

import { ItemDetailTooltip } from "./ItemDetailTooltip";
import { ImageDetailList } from "./ImageDetailList";

import { ExtendedImageObject } from "store/dataV2/types";

export const ImageDetailContainer = ({
  position,
  backgroundColor,
  categoryName,
  image,
  usePredictedStyle,
}: {
  position: { top: string; left: string };
  backgroundColor: string;
  categoryName: string;
  image: ExtendedImageObject;
  usePredictedStyle: boolean;
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
        contents={
          <ImageDetailList
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
