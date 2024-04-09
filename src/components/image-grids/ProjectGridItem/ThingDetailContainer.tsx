import { Box, Typography, useTheme } from "@mui/material";
import {
  InfoOutlined as InfoOutlinedIcon,
  Label as LabelIcon,
  LabelImportant as LabelImportantIcon,
} from "@mui/icons-material";
import { NewItemDetailTooltip } from "./NewItemDetailTooltip";
import { ThingDetailList } from "./ThingDetailList";
import { ThingType } from "store/data/types";

export const ThingDetailContainer = ({
  position,
  backgroundColor,
  categoryName,
  thing,
  usePredictedStyle,
}: {
  position: { top: number; left: number };
  backgroundColor: string;
  categoryName: string;
  thing: ThingType;
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
      <NewItemDetailTooltip
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
      </NewItemDetailTooltip>

      <Box sx={{ flexGrow: 1 }} />

      <NewItemDetailTooltip
        contents={
          <ThingDetailList
            thing={thing}
            color={theme.palette.getContrastText(backgroundColor)}
          />
        }
        backgroundColor={backgroundColor}
      >
        <InfoOutlinedIcon
          sx={{ mt: "8px", ml: "8px", color: backgroundColor }}
        />
      </NewItemDetailTooltip>
    </Box>
  );
};
