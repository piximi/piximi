import { ChangeEvent, useEffect, useMemo, useState } from "react";
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Box,
  Button,
  Checkbox,
  Divider,
  FormControl,
  FormControlLabel,
  MenuItem,
  Select,
  SelectChangeEvent,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import {
  DimensionOrder,
  TiffAnalysisResult,
  TiffImportConfig,
} from "utils/file-io/file-loader/types";

export const TiffConfigurator = ({
  tiffAnalysis,
  config,
  updateConfigs,
  resetConfig,
  updateAll,
  requiredChannels,
  setRequiredChannels,
  canConfigureChannels,
  updateError,
  index,
}: {
  tiffAnalysis: TiffAnalysisResult;
  config: TiffImportConfig;
  updateConfigs: <K extends keyof TiffImportConfig>(
    fileName: string,
    key: K,
    value: TiffImportConfig[K],
  ) => void;
  resetConfig: (fileName: string) => void;
  updateAll: (config: TiffImportConfig) => void;
  requiredChannels?: number;
  setRequiredChannels: (v: number) => void;
  canConfigureChannels: boolean;
  updateError: (error: boolean) => void;
  index: number;
}) => {
  const tiffInfo = tiffAnalysis;

  const [overrideTiff, setOverrideTiff] = useState(false);

  const [inputError, setInputError] = useState<string>();

  const containsTiffValues = useMemo(
    () =>
      !!tiffInfo?.OMEDims?.sizec ||
      !!tiffInfo?.OMEDims?.sizet ||
      !!tiffInfo?.OMEDims?.sizez,
    [tiffInfo],
  );

  const handleChangeDimensionOrder = (event: SelectChangeEvent) => {
    const value = event.target.value as TiffImportConfig["dimensionOrder"];
    updateConfigs(tiffAnalysis.fileName, "dimensionOrder", value);
  };
  const handleChangeChannels = (
    event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    const value = Number(event.target.value);
    if (!Number.isNaN(Number(value))) {
      if (index === 0 && canConfigureChannels) setRequiredChannels(value);
      updateConfigs(tiffAnalysis.fileName, "channels", value);
    }
  };
  const handleChangeFrames = (
    event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    const value = Number(event.target.value);
    if (!Number.isNaN(Number(value)))
      updateConfigs(tiffAnalysis.fileName, "frames", value);
  };
  const handleChangeSlices = (
    event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    const value = Number(event.target.value);
    if (!Number.isNaN(Number(value)))
      updateConfigs(tiffAnalysis.fileName, "slices", value);
  };

  useEffect(() => {
    if (tiffInfo?.frameCount) {
      if (
        config.channels * config.slices * config.frames !==
        tiffInfo.frameCount
      ) {
        setInputError(
          `C \u00D7 Z \u00D7 T must equal ${tiffInfo.frameCount} frames
          (currently ${config.channels} \u00D7 ${config.slices} \u00D7 ${config.frames} =
           ${config.channels * config.slices * config.frames})`,
        );
        updateError(true);
      } else if (requiredChannels && config.channels !== requiredChannels) {
        setInputError(
          `All images in this project must have ${requiredChannels} channels (set by ${canConfigureChannels ? "image 1" : "existing images"}) `,
        );
        updateError(true);
      } else {
        setInputError(undefined);
        updateError(false);
      }
    }
  }, [config, requiredChannels]);

  useEffect(() => {
    // Note: Can only happen when configs change through use of "Apply All"
    // from another image.

    // If there are dims from the file and the set configs deviate from
    // the file dims, signify override.
    if (
      containsTiffValues &&
      !overrideTiff &&
      (config.channels !== tiffInfo?.OMEDims?.sizec ||
        config.slices !== tiffInfo?.OMEDims?.sizez ||
        (!!tiffInfo?.OMEDims?.sizet &&
          config.frames !== tiffInfo?.OMEDims?.sizet))
    )
      setOverrideTiff(true);
  }, [config, containsTiffValues, overrideTiff]);

  return (
    <Box
      sx={(theme) => ({
        mb: 1,
        border: `1px solid ${theme.palette.text.primary}`,
        borderRadius: 2,
      })}
    >
      <Accordion
        defaultExpanded={index === 0}
        sx={{
          bgcolor: "rgba(0,0,0,0.25)",
          boxShadow: "none",
          borderRadius: 2,
          "&:last-of-type": { borderRadius: 2 },
          "&:first-of-type": { borderRadius: 2 },
        }}
      >
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <Typography
            component="em"
            fontWeight="medium"
            color={inputError ? "error" : "inherit"}
          >
            {tiffAnalysis.fileName}
          </Typography>
        </AccordionSummary>
        <AccordionDetails sx={{ py: 1.5, px: 3 }}>
          <Stack
            direction="row"
            justifyContent="space-between"
            alignItems="center"
            mb={1}
          >
            <Typography variant="body2" mb={2}>
              Detected <strong>{tiffInfo?.frameCount ?? 0} frames</strong>
            </Typography>

            <OverrideOption
              disabled={!containsTiffValues}
              canOverride={overrideTiff}
              onChange={() => {
                setOverrideTiff((override) => !override);
                if (overrideTiff) {
                  resetConfig(tiffAnalysis.fileName);
                }
              }}
            />
          </Stack>

          <Divider sx={{ mb: 2 }} />

          <Stack spacing={2} mb={2}>
            {/* Dimension Order */}
            <Stack direction="row" alignItems="center" spacing={1}>
              <Typography variant="body2">Dimension Order:</Typography>
              <FormControl size="small">
                <Select
                  value={config.dimensionOrder}
                  onChange={handleChangeDimensionOrder}
                  disabled={
                    !!tiffInfo?.OMEDims?.dimensionorder && !overrideTiff
                  }
                >
                  {DimensionOrder.map(
                    (order: (typeof DimensionOrder)[number]) => (
                      <MenuItem
                        key={`tiff-dimension-order-${order}`}
                        value={order}
                      >
                        {order.toUpperCase()}
                      </MenuItem>
                    ),
                  )}
                </Select>
              </FormControl>
            </Stack>

            {/* C / Z / T inputs */}
            <Stack direction="row" spacing={2}>
              <Stack direction="row" alignItems="center" spacing={1}>
                <Typography variant="body2">Channels:</Typography>
                <TextField
                  size="small"
                  value={config.channels}
                  disabled={
                    tiffInfo?.OMEDims?.sizec !== undefined && !overrideTiff
                  }
                  error={!!inputError}
                  onChange={handleChangeChannels}
                  slotProps={{ input: { style: { width: "7ch" } } }}
                />
              </Stack>

              <Stack direction="row" alignItems="center" spacing={1}>
                <Typography variant="body2">Slices:</Typography>
                <TextField
                  size="small"
                  value={config.slices}
                  disabled={
                    tiffInfo?.OMEDims?.sizez !== undefined && !overrideTiff
                  }
                  error={!!inputError}
                  onChange={handleChangeSlices}
                  slotProps={{ input: { style: { width: "7ch" } } }}
                />
              </Stack>

              <Stack direction="row" alignItems="center" spacing={1}>
                <Typography variant="body2">Timepoints:</Typography>
                <TextField
                  size="small"
                  value={config.frames}
                  disabled={
                    tiffInfo?.OMEDims?.sizet !== undefined && !overrideTiff
                  }
                  error={!!inputError}
                  onChange={handleChangeFrames}
                  slotProps={{ input: { style: { width: "7ch" } } }}
                />
              </Stack>
            </Stack>
          </Stack>

          <Box
            sx={{
              display: "flex",
              justifyContent: inputError ? "space-between" : "flex-end",
              alignItems: "center",
            }}
          >
            {inputError && (
              <Typography variant="body2" color="error">
                {inputError}
              </Typography>
            )}
            <Button
              variant="text"
              onClick={() => {
                updateAll(config);
              }}
            >
              Apply to all
            </Button>
          </Box>
        </AccordionDetails>
      </Accordion>
    </Box>
  );
};

const OverrideOption = ({
  disabled,
  canOverride,
  onChange,
}: {
  disabled: boolean;
  canOverride: boolean;
  onChange: () => void;
}) => {
  return (
    <FormControlLabel
      label={
        <Typography variant="body2">Override tiff defined values?</Typography>
      }
      disabled={disabled}
      control={
        <Checkbox
          checked={canOverride}
          onChange={onChange}
          size="small"
          color="primary"
        />
      }
    />
  );
};
