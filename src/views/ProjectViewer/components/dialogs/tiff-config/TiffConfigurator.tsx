import { useState } from "react";

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
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";

import { DimensionOrder } from "core/file-io/file-loader/types";

import { StyledSelect } from "components/inputs";

import type { ChangeEvent } from "react";

import type { SelectChangeEvent } from "@mui/material";

import type {
  DimensionConfig,
  TiffAnalysisResult,
  TiffImportConfig,
} from "core/file-io/file-loader/types";

const getDimInputStyle = (fromFile: boolean) => ({
  "& .MuiInputBase-input": {
    px: 1,
    py: 0,
  },
  "& .MuiOutlinedInput-notchedOutline": {
    borderColor: fromFile ? "var(--mui-palette-warning-dark)" : undefined,
  },
  "& .Mui-disabled .MuiOutlinedInput-notchedOutline": {
    borderColor: fromFile
      ? "var(--mui-palette-warning-dark) !important"
      : undefined,
    borderStyle: "dashed",
  },
});
export const validateTiffConfig = (
  tiffInfo: TiffAnalysisResult,
  config: TiffImportConfig,
  canConfigureChannels: boolean,
  requiredChannels?: number,
) => {
  if (tiffInfo.frameCount) {
    if (
      config.channels * config.slices * config.frames !==
      tiffInfo.frameCount
    ) {
      return `C \u00D7 Z \u00D7 T must equal ${tiffInfo.frameCount} frames
          (currently ${config.channels} \u00D7 ${config.slices} \u00D7 ${config.frames} =
           ${config.channels * config.slices * config.frames})`;
    } else if (requiredChannels && config.channels !== requiredChannels) {
      return `All images in this project must have ${requiredChannels} channels (set by ${canConfigureChannels ? "image 1" : "existing images"}) `;
    }
  }
  return undefined;
};
export const TiffConfigurator = ({
  tiffAnalysis,
  config,
  updateConfigs,
  resetConfig,
  updateAll,
  requiredChannels,
  canConfigureChannels,
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
  canConfigureChannels: boolean;
  index: number;
}) => {
  const tiffInfo = tiffAnalysis;

  const [overrideTiff, setOverrideTiff] = useState(false);

  const inputError = validateTiffConfig(
    tiffAnalysis,
    config,
    canConfigureChannels,
    requiredChannels,
  );

  const dims = tiffInfo.OMEDims;
  const containsTiffValues = !!dims?.sizec || !!dims?.sizet || !!dims?.sizez;
  const deviatesFromFile =
    (dims?.sizec !== undefined && config.channels !== dims.sizec) ||
    (dims?.sizez !== undefined && config.slices !== dims.sizez) ||
    (dims?.sizet !== undefined && config.frames !== dims.sizet);
  const override = overrideTiff || deviatesFromFile;

  const handleChangeDimensions =
    (dim: keyof DimensionConfig) =>
    (
      event:
        | SelectChangeEvent
        | ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
    ) => {
      const value = event.target.value as TiffImportConfig[typeof dim];
      updateConfigs(tiffAnalysis.fileName, dim, value);
    };

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
          boxShadow: "none",
          borderRadius: 2,
          "&:last-of-type": { borderRadius: 2 },
          "&:first-of-type": { borderRadius: 2 },
        }}
      >
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <Typography
            component="em"
            color={inputError ? "error" : "inherit"}
            sx={{
              fontWeight: "medium",
            }}
          >
            {tiffAnalysis.fileName}
          </Typography>
        </AccordionSummary>
        <AccordionDetails sx={{ py: 1.5, px: 3 }}>
          <Stack
            direction="row"
            sx={{
              justifyContent: "space-between",
              alignItems: "center",
              mb: 1,
            }}
          >
            <Typography
              variant="body2"
              sx={{
                mb: 2,
              }}
            >
              Detected <strong>{tiffInfo?.frameCount ?? 0} frames</strong>
            </Typography>

            <OverrideOption
              disabled={!containsTiffValues}
              canOverride={override}
              onChange={() => {
                if (override) {
                  setOverrideTiff(false);
                  resetConfig(tiffAnalysis.fileName);
                } else {
                  setOverrideTiff(true);
                }
              }}
            />
          </Stack>

          <Divider sx={{ mb: 2 }} />

          <Stack
            spacing={2}
            sx={{
              mb: 2,
            }}
          >
            {/* Dimension Order */}
            <Stack
              direction="row"
              spacing={1}
              sx={{
                alignItems: "center",
              }}
            >
              <Typography variant="body2">Dimension Order:</Typography>
              <FormControl size="small">
                <StyledSelect
                  value={config.dimensionOrder}
                  // @ts-ignore StyledSelect has a narrower prop type, but this works fine
                  onChange={handleChangeDimensions("dimensionOrder")}
                  disabled={!!dims?.dimensionorder && !override}
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
                </StyledSelect>
              </FormControl>
            </Stack>

            {/* C / Z / T inputs */}
            <Stack direction="row" spacing={2}>
              <Stack
                direction="row"
                spacing={1}
                sx={{
                  alignItems: "center",
                }}
              >
                <Typography variant="body2">Channels:</Typography>
                <TextField
                  size="small"
                  value={config.channels}
                  disabled={dims?.sizec !== undefined && !override}
                  error={!!inputError}
                  onChange={handleChangeDimensions("channels")}
                  slotProps={{
                    input: { style: { paddingBlock: 0, width: "7ch" } },
                  }}
                  sx={getDimInputStyle(!!dims?.sizec)}
                />
              </Stack>

              <Stack
                direction="row"
                spacing={1}
                sx={{
                  alignItems: "center",
                }}
              >
                <Typography variant="body2">Slices:</Typography>
                <TextField
                  size="small"
                  value={config.slices}
                  disabled={dims?.sizez !== undefined && !override}
                  error={!!inputError}
                  onChange={handleChangeDimensions("slices")}
                  slotProps={{ input: { style: { width: "7ch" } } }}
                  sx={getDimInputStyle(!!dims?.sizez)}
                />
              </Stack>

              <Stack
                direction="row"
                spacing={1}
                sx={{
                  alignItems: "center",
                }}
              >
                <Typography variant="body2">{"Timepoints:"}</Typography>
                <TextField
                  size="small"
                  value={config.frames}
                  disabled={dims?.sizet !== undefined && !override}
                  error={!!inputError}
                  onChange={handleChangeDimensions("frames")}
                  slotProps={{ input: { style: { width: "7ch" } } }}
                  sx={getDimInputStyle(!!dims?.sizet)}
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
        <Typography variant="body2">
          Override{" "}
          <span style={{ color: "var(--mui-palette-warning-dark)" }}>
            tiff defined values
          </span>
          ?
        </Typography>
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
