import { useEffect, useMemo, useState } from "react";
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Box,
  Checkbox,
  Divider,
  FormControl,
  FormControlLabel,
  MenuItem,
  Select,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import {
  DimensionOrder,
  TiffAnalysisResult,
  TiffImportConfig,
} from "utils/file-io-v2/types";

export const TiffConfigurator = ({
  tiffAnalysis,
  updateConfigs,
  updateError,
  index,
}: {
  tiffAnalysis: TiffAnalysisResult;
  updateConfigs: (config: TiffImportConfig) => void;
  updateError: (error: boolean) => void;
  index: number;
}) => {
  const tiffInfo = tiffAnalysis;

  const [selectedChannels, setSelectedChannels] = useState<
    TiffImportConfig["channels"]
  >(tiffInfo?.OMEDims?.sizec ?? 1);
  const [selectedSlices, setSelectedSlices] = useState<
    TiffImportConfig["slices"]
  >(tiffInfo?.OMEDims?.sizez ?? 1);
  const [selectedFrames, setSelectedFrames] = useState<
    TiffImportConfig["frames"]
  >(tiffInfo?.OMEDims?.sizet ?? 1);
  const [selectedDimensionOrder, setSelectedDimensionOrder] = useState<
    TiffImportConfig["dimensionOrder"]
  >(tiffInfo?.OMEDims?.dimensionorder ?? "xyczt");
  const [overrideTiff, setOverrideTiff] = useState(false);

  const [inputError, setInputError] = useState<string>();

  const containsTiffValues = useMemo(
    () =>
      !!tiffInfo?.OMEDims?.sizec ||
      !!tiffInfo?.OMEDims?.sizet ||
      !!tiffInfo?.OMEDims?.sizez,
    [tiffInfo],
  );

  useEffect(() => {
    if (tiffInfo?.frameCount) {
      if (
        selectedChannels * selectedSlices * selectedFrames !==
        tiffInfo.frameCount
      ) {
        setInputError(
          `C \u00D7 Z \u00D7 T must equal ${tiffInfo.frameCount} frames
          (currently ${selectedChannels} \u00D7 ${selectedSlices} \u00D7 ${selectedFrames} =
           ${selectedChannels * selectedSlices * selectedFrames})`,
        );
        updateError(true);
      } else {
        setInputError(undefined);
        updateError(false);
      }
    }
  }, [selectedChannels, selectedFrames, selectedSlices]);

  useEffect(() => {
    updateConfigs({
      slices: selectedSlices,
      frames: selectedFrames,
      channels: selectedChannels,
      dimensionOrder: selectedDimensionOrder,
    });
  }, [
    selectedChannels,
    selectedDimensionOrder,
    selectedFrames,
    selectedSlices,
  ]);

  return (
    <Box sx={{ p: 2, pt: 3 }}>
      <Accordion
        defaultExpanded={index === 0}
        sx={{ bgcolor: "rgba(0,0,0,0.25)" }}
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
                  if (tiffInfo?.OMEDims?.sizet)
                    setSelectedFrames(tiffInfo!.OMEDims!.sizet!);
                  if (tiffInfo?.OMEDims?.sizez)
                    setSelectedSlices(tiffInfo!.OMEDims!.sizez!);
                  if (tiffInfo?.OMEDims?.sizec)
                    setSelectedChannels(tiffInfo!.OMEDims!.sizec!);
                  if (tiffInfo?.OMEDims?.dimensionorder)
                    setSelectedDimensionOrder(
                      tiffInfo!.OMEDims!.dimensionorder!,
                    );
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
                  value={selectedDimensionOrder}
                  onChange={(e) =>
                    setSelectedDimensionOrder(
                      e.target.value as TiffImportConfig["dimensionOrder"],
                    )
                  }
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
                  value={selectedChannels}
                  disabled={
                    tiffInfo?.OMEDims?.sizec !== undefined && !overrideTiff
                  }
                  error={!!inputError}
                  onChange={(e) => {
                    if (!Number.isNaN(Number(e.target.value)))
                      setSelectedChannels(Number(e.target.value));
                  }}
                  slotProps={{ input: { style: { width: "7ch" } } }}
                />
              </Stack>

              <Stack direction="row" alignItems="center" spacing={1}>
                <Typography variant="body2">Slices:</Typography>
                <TextField
                  size="small"
                  value={selectedSlices}
                  disabled={
                    tiffInfo?.OMEDims?.sizez !== undefined && !overrideTiff
                  }
                  error={!!inputError}
                  onChange={(e) => {
                    if (!Number.isNaN(Number(e.target.value)))
                      setSelectedSlices(Number(e.target.value));
                  }}
                  slotProps={{ input: { style: { width: "7ch" } } }}
                />
              </Stack>

              <Stack direction="row" alignItems="center" spacing={1}>
                <Typography variant="body2">Timepoints:</Typography>
                <TextField
                  size="small"
                  value={selectedFrames}
                  disabled={
                    tiffInfo?.OMEDims?.sizet !== undefined && !overrideTiff
                  }
                  error={!!inputError}
                  onChange={(e) => {
                    if (!Number.isNaN(Number(e.target.value)))
                      setSelectedFrames(Number(e.target.value));
                  }}
                  slotProps={{ input: { style: { width: "7ch" } } }}
                />
              </Stack>
            </Stack>
          </Stack>

          {inputError && (
            <Typography variant="body2" color="error">
              {inputError}
            </Typography>
          )}
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
