import { Fragment, useMemo } from "react";

import { Box, Divider, MenuItem, Typography, useTheme } from "@mui/material";
import ArrowRightAltIcon from "@mui/icons-material/ArrowRightAlt";

import { StyledSelect } from "components/inputs";

import { arrayRange } from "utils/arrayUtils";

import { useSegmenterStatus } from "@ProjectViewer/contexts/SegmenterStatusProvider";

import type { SelectChangeEvent } from "@mui/material";

const HEADER_SX = {
  textTransform: "uppercase",
  letterSpacing: "0.06em",
  fontSize: 10,
  lineHeight: 1.6,
} as const;

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

  return !loadedModel || availableChannels.length === 0 ? null : (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        width: "100%",
      }}
    >
      <Box sx={{ pb: 1.75 }}>
        <Typography
          variant="overline"
          color="text.secondary"
          sx={{ display: "block", lineHeight: 1.6, mb: 1.25 }}
        >
          Channel Mapping
        </Typography>

        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: "max-content 16px 1fr",
            alignItems: "center",
            columnGap: 1.25,
            rowGap: 1.125,
            px: 1,
          }}
        >
          {/* Column headers */}
          <Typography variant="caption" color="text.disabled" sx={HEADER_SX}>
            Model Input
          </Typography>
          <Box />
          <Typography variant="caption" color="text.disabled" sx={HEADER_SX}>
            Image Source
          </Typography>
          <Divider sx={{ gridColumn: "1 / -1" }} />

          {/* One row per channel the model requires */}
          {arrayRange(loadedModel.requiredChannels).map((idx) => (
            <Fragment key={idx}>
              <Typography variant="body2" color="text.secondary">
                Channel {idx + 1}
              </Typography>

              <ArrowRightAltIcon
                sx={{ fontSize: 16, color: "text.disabled", opacity: 0.6 }}
              />

              <StyledSelect
                value={selectedChannels[idx] ?? ""}
                onChange={(event) => handleSelectedChannelChange(event, idx)}
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
            </Fragment>
          ))}
        </Box>
      </Box>
    </Box>
  );
};
