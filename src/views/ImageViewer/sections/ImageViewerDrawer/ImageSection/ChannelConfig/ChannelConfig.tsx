import { useState } from "react";

import { Box, Collapse } from "@mui/material";

import { selectChannelMetaById } from "store/data/selectors";
import type { ExtendedChannel } from "store/data/types";
import { useParameterizedSelector } from "store/hooks";

import { ChannelHeader } from "./ChannelHeader";
import { PlotOptions } from "./PlotOptions";
import { ChannelOptions } from "./ChannelOptions";

export const ChannelConfig = ({ channel }: { channel: ExtendedChannel }) => {
  const channelMeta = useParameterizedSelector(
    selectChannelMetaById,
    channel.channelMetaId,
  );

  const [showSettings, setShowSettings] = useState(false);

  const handleToggleSettings = () => {
    setShowSettings((v) => !v);
  };

  return (
    <Box
      key={channelMeta.id}
      sx={{
        display: "flex",
        flexDirection: "column",
        borderBottom: 2,
        borderColor: "divider",
        px: 1,
        pb: 1,
        mb: 1,
      }}
    >
      <ChannelHeader
        channelMeta={channelMeta}
        toggleSettings={handleToggleSettings}
      />
      <Collapse in={showSettings}>
        <Box
          sx={{
            display: "flex",
            flexDirection: "column",
          }}
        >
          <PlotOptions
            channelMetaId={channelMeta.id}
            bitDepth={channel.bitDepth}
            plotMin={channelMeta.rampMinLimit}
            plotMax={channelMeta.rampMaxLimit}
          />
          <ChannelOptions
            channel={channel}
            rampMin={channel.rampMin}
            rampMax={channel.rampMax}
            plotMin={channelMeta.rampMinLimit}
            plotMax={channelMeta.rampMaxLimit}
            minChannelValue={channel.minValue}
            maxChannelValue={channel.maxValue}
            globalMin={channelMeta.minValue}
            globalMax={channelMeta.maxValue}
          />
        </Box>
      </Collapse>
    </Box>
  );
};
