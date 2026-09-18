import { Box, Stack, Typography } from "@mui/material";

import { useDialogHotkey } from "hooks";

import { HotkeyContext } from "utils/enums";

import { HelpItem } from "data/help/HelpContent";

import { TooltipTextButton } from "views/ProjectViewer/components";

import { useSegmenterStatus } from "@ProjectViewer/contexts/SegmenterStatusProvider";

import { LoadSegmentationModelDialog } from "./LoadSegmentationModelDialog";
import { SegmenterOptions } from "./SegmentationOptions";

export const ModelInfo = () => {
  const { loadedModel } = useSegmenterStatus();
  const {
    onClose: onCloseImportSegmenterDialog,
    onOpen: onOpenImportSegmenterDialog,
    open: importSegmenterDialogOpen,
  } = useDialogHotkey(HotkeyContext.ConfirmationDialog);
  return (
    <Stack
      sx={{
        width: "100%",
        gap: 0.5,
      }}
    >
      <Typography
        variant="overline"
        color="text.secondary"
        sx={{ display: "block", lineHeight: 1.6 }}
      >
        Selected Model
      </Typography>

      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",

          pl: 1,
        }}
      >
        <Typography
          variant="caption"
          noWrap
          sx={{ display: "block", lineHeight: 1.6 }}
        >
          {`${loadedModel ? loadedModel.name : "No Selected Model"}`}
        </Typography>
        <TooltipTextButton
          dataHelp={HelpItem.LoadClassificationModel}
          label="Select Model"
          tooltipText="Load a pre-trained model"
          onClick={onOpenImportSegmenterDialog}
          sx={{
            font: "var(--mui-font-caption)",
            color: "var(--mui-palette-primary-main)",
          }}
        />
      </Box>
      <Typography
        variant="overline"
        color="text.secondary"
        sx={{ display: "block", lineHeight: 1.6 }}
      >
        Model Output
      </Typography>
      <Typography
        variant="caption"
        noWrap
        sx={{ display: "block", lineHeight: 2.2, pl: 1 }}
      >
        {`${loadedModel?.kind ?? "N/A"}`}
      </Typography>
      <SegmenterOptions />
      <LoadSegmentationModelDialog
        onClose={onCloseImportSegmenterDialog}
        open={importSegmenterDialogOpen}
      />
    </Stack>
  );
};
