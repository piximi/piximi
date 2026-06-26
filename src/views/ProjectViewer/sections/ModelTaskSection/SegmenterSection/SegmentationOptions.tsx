import { useMemo } from "react";

import type { SelectChangeEvent } from "@mui/material";
import { Box, MenuItem, useTheme } from "@mui/material";

import { StyledSelect, WithLabel } from "components/inputs";

import { useSegmenterStatus } from "@ProjectViewer/contexts/SegmenterStatusProvider";

export const SegmenterOptions = () => {
  const theme = useTheme();

  const { selectedModel, channelMetas, selectedChannel, setSelectedChannel } =
    useSegmenterStatus();

  const availableChannels = useMemo(
    () => Object.values(channelMetas),
    [channelMetas],
  );
  const handleSelectedChannelChange = (event: SelectChangeEvent<unknown>) => {
    setSelectedChannel(event.target.value as string);
  };

  return !selectedModel ? null : (
    <Box
      sx={{
        display: "flex",
        width: "100%",
        pb: 1,
        borderBottom: `1px solid ${theme.palette.divider}`,
      }}
    >
      <WithLabel
        label="Channel:"
        labelProps={{
          variant: "caption",
          sx: { mr: "1rem", whiteSpace: "nowrap" },
        }}
      >
        <StyledSelect
          value={selectedChannel}
          onChange={handleSelectedChannelChange}
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
    </Box>
  );
};
