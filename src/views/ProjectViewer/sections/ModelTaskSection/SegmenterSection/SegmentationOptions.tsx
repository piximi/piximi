import { useMemo } from "react";

import type { SelectChangeEvent } from "@mui/material";
import { Box, MenuItem, useTheme } from "@mui/material";

import { StyledSelect, WithLabel } from "components/inputs";

import { useSegmenterStatus } from "@ProjectViewer/contexts/SegmenterStatusProvider";

import { arrayRange } from "utils/arrayUtils";

export const SegmenterOptions = () => {
  const theme = useTheme();

  const { loadedModel, channelMetas, selectedChannels, setSelectedChannels } =
    useSegmenterStatus();

  const availableChannels = useMemo(
    () => Object.values(channelMetas),
    [channelMetas],
  );
  const handleSelectedChannelChange = (
    event: SelectChangeEvent<unknown>,
    channelIndex: number,
  ) => {
    const channelId = event.target.value as string;

    setSelectedChannels((chs) => {
      if (chs[channelIndex] === channelId) return chs;
      const _chs = [...chs];
      _chs[channelIndex] = channelId;
      return _chs;
    });
  };

  return !loadedModel ? null : (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        width: "100%",
        pb: 1,
        borderBottom: `1px solid ${theme.palette.divider}`,
      }}
    >
      {arrayRange(loadedModel.requiredChannels).map((i) => (
        <WithLabel
          key={`channel-select=${i}`}
          label={`Channel ${i + 1}:`}
          labelProps={{
            variant: "caption",
            sx: { mr: "1rem", whiteSpace: "nowrap" },
          }}
        >
          <StyledSelect
            value={selectedChannels[i] ?? ""}
            onChange={(event) => handleSelectedChannelChange(event, i)}
            fullWidth
            fontSize={theme.typography.caption.fontSize}
            displayEmpty={true}
            renderValue={(value) => {
              return value === ""
                ? "Select Channel"
                : channelMetas[value as string].name;
            }}
          >
            {availableChannels.map((channel) => (
              <MenuItem
                key={channel.id}
                dense
                value={channel.id}
                sx={{
                  borderRadius: 0,
                  minHeight: "1rem",
                }}
              >
                {channel.name}
              </MenuItem>
            ))}
          </StyledSelect>
        </WithLabel>
      ))}
    </Box>
  );
};
