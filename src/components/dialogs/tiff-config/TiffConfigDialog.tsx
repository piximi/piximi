import { useEffect, useState } from "react";
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  Typography,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";

import { TiffConfigurator } from "./TiffConfigurator";
import {
  TiffAnalysisResult,
  TiffDialogCallbackResult,
  TiffImportConfig,
} from "utils/file-io-v2/file-loader/types";

type TiffConfigDialogProps = {
  open: boolean;
  analysisResult: TiffAnalysisResult[];
  onConfirm: (config: TiffDialogCallbackResult) => void;
  onCancel: () => void;
};

export const TiffConfigDialog = ({
  open,
  analysisResult,
  onConfirm,
  onCancel,
}: TiffConfigDialogProps) => {
  const [configs, setConfigs] = useState<TiffDialogCallbackResult>({});
  const [errors, setErrors] = useState<Record<string, boolean>>(
    analysisResult.reduce((errors: Record<string, boolean>, analysis) => {
      errors[analysis.fileName] = false;
      return errors;
    }, {}),
  );

  const updateTiffConfig = (fileName: string) => {
    return (config: TiffImportConfig) => {
      setConfigs((configs) => Object.assign(configs, { [fileName]: config }));
    };
  };

  const updateTiffConfigErrors = (fileName: string) => {
    return (error: boolean) => {
      setErrors((errors) => ({ ...errors, [fileName]: error }));
    };
  };

  const [inputError, setInputError] = useState<boolean>();

  const handleConfirm = () => {
    onConfirm(configs);
  };

  useEffect(() => {
    if (Object.values(errors).some((error) => error)) {
      setInputError(true);
      return;
    }
    setInputError(false);
  }, [errors]);

  return (
    <Dialog open={open} onClose={onCancel} maxWidth="md" fullWidth>
      <DialogTitle>
        Import TIFF Stack
        <IconButton
          aria-label="Close"
          onClick={onCancel}
          size="small"
          sx={{ position: "absolute", right: 8, top: 8 }}
        >
          <CloseIcon fontSize="small" />
        </IconButton>
      </DialogTitle>

      <DialogContent dividers sx={{ p: 0 }}>
        <Typography variant="body2" sx={{ px: 2, pt: 1 }}>
          How should these frames be interpreted?
        </Typography>
        {analysisResult.map((analysis, idx) => (
          <TiffConfigurator
            key={`config-${idx}`}
            tiffAnalysis={analysis}
            updateConfigs={updateTiffConfig(analysis.fileName)}
            updateError={updateTiffConfigErrors(analysis.fileName)}
            index={idx}
          />
        ))}
      </DialogContent>

      <DialogActions>
        <Button onClick={onCancel} color="inherit">
          Cancel
        </Button>
        <Button
          onClick={handleConfirm}
          disabled={inputError}
          variant="contained"
        >
          Import
        </Button>
      </DialogActions>
    </Dialog>
  );
};
