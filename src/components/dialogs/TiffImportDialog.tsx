import React, { useState } from "react";
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  FormControlLabel,
  IconButton,
  Radio,
  RadioGroup,
  Typography,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";

import { FileAnalysisResult, TiffImportConfig } from "services/dataPipeline";

type TiffImportDialogProps = {
  open: boolean;
  analysisResult: FileAnalysisResult;
  onConfirm: (config: TiffImportConfig) => void;
  onCancel: () => void;
};

const FRAME_TYPES = [
  {
    value: "timeSeries" as const,
    label: "Time Series",
    description: "Frames are different time points",
  },
  {
    value: "zStack" as const,
    label: "Z-Stack",
    description: "Frames are different focal planes",
  },
  {
    value: "channels" as const,
    label: "Channels",
    description: "Frames are different channels",
  },
  {
    value: "separate" as const,
    label: "Separate Images",
    description: "Import each frame as an independent image",
  },
];

export const TiffImportDialog = ({
  open,
  analysisResult,
  onConfirm,
  onCancel,
}: TiffImportDialogProps) => {
  const tiffInfo = analysisResult.tiffInfo;
  const [selectedType, setSelectedType] = useState<
    TiffImportConfig["interpretAs"]
  >(
    tiffInfo?.suggestedType !== "unknown"
      ? tiffInfo!.suggestedType
      : "timeSeries",
  );

  const handleConfirm = () => {
    onConfirm({ interpretAs: selectedType });
  };

  return (
    <Dialog fullWidth maxWidth="sm" open={open} onClose={onCancel}>
      <DialogTitle
        sx={{
          borderBottom: (theme) => `1px solid ${theme.palette.divider}`,
          m: 0,
          p: 2,
        }}
      >
        Import TIFF Stack
        <IconButton
          aria-label="Close"
          sx={(theme) => ({
            color: theme.palette.grey[500],
            position: "absolute",
            right: theme.spacing(1),
            top: theme.spacing(1),
          })}
          onClick={onCancel}
        >
          <CloseIcon />
        </IconButton>
      </DialogTitle>
      <DialogContent sx={{ pt: 2 }}>
        <Typography variant="body1" gutterBottom>
          Detected <strong>{tiffInfo?.frameCount ?? 0} frames</strong> in{" "}
          <em>{analysisResult.fileName}</em>
        </Typography>

        {tiffInfo?.suggestedType !== "unknown" && (
          <Typography variant="body2" color="text.secondary" gutterBottom>
            Suggested: {tiffInfo?.suggestedType}
            {tiffInfo?.confidence !== undefined &&
              ` (${Math.round(tiffInfo.confidence * 100)}% confidence)`}
          </Typography>
        )}

        <Typography variant="body2" sx={{ mt: 2, mb: 1 }}>
          How should these frames be interpreted?
        </Typography>

        <FormControl component="fieldset">
          <RadioGroup
            value={selectedType}
            onChange={(e) =>
              setSelectedType(e.target.value as TiffImportConfig["interpretAs"])
            }
          >
            {FRAME_TYPES.map(({ value, label, description }) => (
              <FormControlLabel
                key={value}
                value={value}
                control={<Radio />}
                label={
                  <Typography variant="body2">
                    <strong>{label}</strong> — {description}
                  </Typography>
                }
              />
            ))}
          </RadioGroup>
        </FormControl>
      </DialogContent>
      <DialogActions>
        <Button onClick={onCancel}>Cancel</Button>
        <Button variant="contained" onClick={handleConfirm}>
          Import
        </Button>
      </DialogActions>
    </Dialog>
  );
};
