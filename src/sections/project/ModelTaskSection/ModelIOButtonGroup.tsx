import React from "react";
import { Box, Button } from "@mui/material";
import { SaveAlt as SaveIcon, Add as AddIcon } from "@mui/icons-material";
import { useTranslation } from "hooks";

export const ModelIOButtonGroup = ({
  handleImportModel,
  handleSaveModel,
}: {
  handleImportModel: () => void;
  handleSaveModel: () => void;
}) => {
  const t = useTranslation();
  return (
    <Box display="flex" justifyContent="space-between" width="100%">
      <Button color="inherit" size="small" onClick={handleImportModel}>
        <AddIcon sx={{ fontSize: "1.15rem", mr: 0.5 }} />
        {t("Load Model")}
      </Button>
      <Button color="inherit" size="small" onClick={handleSaveModel}>
        <SaveIcon sx={{ fontSize: "1.15rem", mr: 0.5 }} />
        {t("Save Model")}
      </Button>
    </Box>
  );
};
