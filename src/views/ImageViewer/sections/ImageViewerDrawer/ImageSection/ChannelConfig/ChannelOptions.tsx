import { useDispatch } from "react-redux";

import type { SelectChangeEvent } from "@mui/material";
import { Box, MenuItem, Typography } from "@mui/material";

import { useHistogram } from "hooks";

import { StyledSelect } from "components/inputs";

import { dataSlice } from "store/data";
import type { ExtendedChannel } from "store/data/types";

import { applyChannelPreset, RANGE_PRESETS } from "utils/channelUtils";

import { Histogram } from "./Histogram";

export const ChannelOptions = ({
  channel,
  rampMin,
  rampMax,
  plotMin,
  plotMax,
  minChannelValue,
  maxChannelValue,
  globalMin,
  globalMax,
}: {
  channel: ExtendedChannel;
  rampMin: number;
  rampMax: number;
  plotMin: number;
  plotMax: number;
  minChannelValue: number;
  maxChannelValue: number;
  globalMin: number;
  globalMax: number;
}) => {
  const dispatch = useDispatch();
  const { histogram, numPixels } = useHistogram(channel) ?? {
    histogram: undefined,
    numPixels: undefined,
  };

  const handleApplyPreset = (event: SelectChangeEvent<unknown>) => {
    if (!histogram) return;
    const preset = event.target.value as keyof typeof RANGE_PRESETS;
    const limits = applyChannelPreset(preset, histogram, numPixels, [
      globalMin,
      globalMax,
    ]);
    dispatch(
      dataSlice.actions.updateChannelMeta({
        id: channel.channelMetaId,
        changes: limits,
      }),
    );
  };
  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
      }}
    >
      <Box
        sx={(theme) => ({
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          px: 1,
          fontSize: theme.vars.font.caption,
        })}
      >
        <Typography variant="body2">Apply Preset</Typography>

        <StyledSelect
          value=""
          size="small"
          displayEmpty
          onChange={handleApplyPreset}
          renderValue={() => "Presets"}
        >
          {Object.keys(RANGE_PRESETS).map((preset) => (
            <MenuItem key={preset} value={preset}>
              {RANGE_PRESETS[preset as keyof typeof RANGE_PRESETS]}
            </MenuItem>
          ))}
        </StyledSelect>
      </Box>

      {histogram && (
        <Histogram
          id={channel.channelMetaId}
          histogram={histogram}
          pixelMax={maxChannelValue}
          pixelMin={minChannelValue}
          rampMin={rampMin}
          rampMax={rampMax}
          plotMax={plotMax}
          plotMin={plotMin}
        />
      )}
    </Box>
  );
};
