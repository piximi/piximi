import { useEffect, useMemo, useState } from "react";
import {
  Box,
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
} from "utils/file-io/file-loader/types";
import { useSelector } from "react-redux";
import { selectExperimentChannels } from "store/data/selectors";

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
  const expChannels = useSelector(selectExperimentChannels);
  const [requiredChannels, setRequiredChannels] = useState<number | undefined>(
    expChannels,
  );
  const canConfigureChannels = !expChannels;
  const [configs, setConfigs] = useState<TiffDialogCallbackResult>({});
  const [errors, setErrors] = useState<Record<string, boolean>>(
    analysisResult.reduce((errors: Record<string, boolean>, analysis) => {
      errors[analysis.fileName] = false;
      return errors;
    }, {}),
  );

  const inputError = useMemo(
    () => Object.values(errors).some((error) => error),
    [errors],
  );

  const updateTiffConfig = <K extends keyof TiffImportConfig>(
    fileName: string,
    key: K,
    value: TiffImportConfig[K],
  ) => {
    setConfigs((configs) => ({
      ...configs,
      [fileName]: { ...configs[fileName], [key]: value },
    }));
  };

  const updateAllConfigs = (config: TiffImportConfig) => {
    setConfigs((configs) =>
      Object.keys(configs).reduce(
        (newConfig: TiffDialogCallbackResult, fileName) => {
          newConfig[fileName] = config;
          return newConfig;
        },
        {},
      ),
    );
    setRequiredChannels(config.channels);
  };

  const resetConfig = (fileName: string) => {
    setConfigs((configs) => {
      const analysis = analysisResult.find((an) => an.fileName === fileName);
      if (analysis && analysis.OMEDims) {
        const newConfigs = { ...configs };
        newConfigs[analysis.fileName] = {
          channels: analysis?.OMEDims?.sizec ?? requiredChannels ?? 1,
          frames: analysis?.OMEDims?.sizet ?? 1,
          slices: analysis?.OMEDims?.sizez ?? 1,
          dimensionOrder: analysis?.OMEDims?.dimensionorder ?? "xyczt",
        };
        return newConfigs;
      }
      return configs;
    });
  };

  const updateTiffConfigErrors = (fileName: string) => {
    return (error: boolean) => {
      setErrors((errors) => ({ ...errors, [fileName]: error }));
    };
  };

  const handleConfirm = () => {
    onConfirm(configs);
  };

  useEffect(() => {
    const configs = analysisResult.reduce(
      (newConfig: TiffDialogCallbackResult, analysis) => {
        const config: TiffImportConfig = {
          channels: analysis?.OMEDims?.sizec ?? requiredChannels ?? 1,
          frames: analysis?.OMEDims?.sizet ?? 1,
          slices: analysis?.OMEDims?.sizez ?? 1,
          dimensionOrder: analysis?.OMEDims?.dimensionorder ?? "xyczt",
        };
        newConfig[analysis.fileName] = config;
        return newConfig;
      },
      {},
    );
    setConfigs(configs);
  }, [analysisResult]);

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
        <Typography variant="body1" sx={{ px: 2, pt: 1 }}>
          How should these frames be interpreted?
        </Typography>
        <Box
          sx={{
            display: "flex",
            flexDirection: "column",
            p: 2,
          }}
        >
          {analysisResult.map((analysis, idx) => (
            <TiffConfigurator
              key={`config-${idx}`}
              tiffAnalysis={analysis}
              config={configs[analysis.fileName]}
              updateConfigs={updateTiffConfig}
              resetConfig={resetConfig}
              updateAll={updateAllConfigs}
              updateError={updateTiffConfigErrors(analysis.fileName)}
              requiredChannels={requiredChannels}
              canConfigureChannels={canConfigureChannels}
              setRequiredChannels={setRequiredChannels}
              index={idx}
            />
          ))}
        </Box>
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
