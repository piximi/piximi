import { useSelector } from "react-redux";

import { Box } from "@mui/material";

import { useParameterizedSelector } from "store/hooks";
import { selectActiveExtendedChannels } from "store/data/selectors";

import { selectActiveImageId } from "@ImageViewer/state/image-viewer-data/selectors";

import { ChannelConfig } from "./ChannelConfig";

import type React from "react";

export const ChannelList = () => {
  const activeImageId = useSelector(selectActiveImageId);
  const activeChannels = useParameterizedSelector(
    selectActiveExtendedChannels,
    activeImageId ?? "",
  );

  return activeChannels.length > 0 ? (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        flexGrow: 1,
        minHeight: 0,
        maxHeight: "700px",
        overflowY: "scroll",
        width: "100%",
      }}
    >
      {activeChannels.map((ch) => (
        <ChannelConfig key={ch.id} channel={ch} />
      ))}
    </Box>
  ) : null;
};
