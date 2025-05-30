import React from "react";
import { Box, Button } from "@mui/material";
import { SaveAlt as SaveIcon, Add as AddIcon } from "@mui/icons-material";

import { useTranslation } from "hooks";
import { HelpItem } from "components/layout/HelpDrawer/HelpContent";

export const ModelIOButtonGroup = ({
  hasTrainedModel,
  handleImportModel,
  handleSaveModel,
}: {
  hasTrainedModel: boolean;
  handleImportModel: () => void;
  handleSaveModel: () => void;
}) => {
  const t = useTranslation();
  return (
    <Box display="flex" justifyContent="space-between" width="100%">
      <Button
        data-help={HelpItem.LoadClassificationModel}
        color="inherit"
        size="small"
        onClick={handleImportModel}
      >
        <AddIcon sx={{ fontSize: "1.15rem", mr: 0.5 }} />
        {t("Load Model")}
      </Button>
      <Button
        color="inherit"
        size="small"
        onClick={handleSaveModel}
        disabled={!hasTrainedModel}
        data-help={HelpItem.SaveClassificationModel}
      >
        <SaveIcon sx={{ fontSize: "1.15rem", mr: 0.5 }} />
        {t("Save Model")}
      </Button>
    </Box>
  );
};
