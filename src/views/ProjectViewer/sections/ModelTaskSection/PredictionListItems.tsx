import { Clear as ClearIcon, Check as CheckIcon } from "@mui/icons-material";
import { Box, List } from "@mui/material";

import { useTranslation } from "hooks";

import {
  CustomListItemButton,
  ListItemHoldButton,
} from "@ProjectViewer/components";
import { useAcceptClearPredictions } from "@ProjectViewer/hooks";

export const PredictionListItems = () => {
  const { clearPredictions, acceptPredictions } = useAcceptClearPredictions();

  const t = useTranslation();

  return (
    <Box sx={{ width: "100%" }}>
      <List dense>
        <CustomListItemButton
          primaryText={t("Clear predictions")}
          onClick={clearPredictions}
          icon={
            <ClearIcon
              sx={(theme) => ({ fontSize: theme.typography.body1.fontSize })}
            />
          }
          primaryTypographyProps={{
            variant: "caption",
            textTransform: "uppercase",
          }}
          sx={{ borderRadius: 0 }}
        />
        <ListItemHoldButton
          onHoldComplete={acceptPredictions}
          primaryText="Accept Predictions (Hold)"
          icon={
            <CheckIcon
              sx={(theme) => ({ fontSize: theme.typography.body1.fontSize })}
            />
          }
          holdDuration={100}
          primaryTypographyProps={{
            variant: "caption",
            textTransform: "uppercase",
          }}
        />
      </List>
    </Box>
  );
};
