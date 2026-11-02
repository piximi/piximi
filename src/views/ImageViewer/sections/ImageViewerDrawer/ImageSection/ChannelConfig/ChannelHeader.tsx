import { useState } from "react";

import { ChromePicker } from "react-color";
import { useDispatch } from "react-redux";

import { Box, Checkbox, IconButton, Popover, Typography } from "@mui/material";
import { Settings } from "@mui/icons-material";

import { dataSlice } from "store/data";

import { rgbToHex } from "utils/colorUtils";

import type { ColorResult } from "react-color";

import type { ChannelMeta, ColorMap } from "core/entities";

const ColorPicker = ({
  colorMap,
  updateColorMap,
}: {
  colorMap: ColorMap;
  updateColorMap: (color: ColorMap) => void;
}) => {
  const [channelColorRef, setChannelColorRef] = useState<HTMLDivElement | null>(
    null,
  );
  const [showColorPicker, setShowColorPicker] = useState(false);
  const colorHex = rgbToHex(colorMap);
  const [draftColorMap, setDraftColorMap] = useState(colorHex);
  const [prevColorMap, setPrevColorMap] = useState(colorHex);
  if (colorHex !== prevColorMap) {
    setDraftColorMap(colorHex);
    setPrevColorMap(colorHex);
  }
  const handleOpenColorPicker = (
    event: React.MouseEvent<HTMLDivElement, MouseEvent>,
  ) => {
    setChannelColorRef(event.currentTarget);
    setShowColorPicker(true);
  };
  const handleCloseColorPicker = () => {
    setChannelColorRef(null);
    setShowColorPicker(false);
  };

  const handleColorChange = (color: ColorResult) => {
    if (channelColorRef) {
      setDraftColorMap(color.hex);
    }
  };

  const handleCommitColorChange = (color: ColorResult) => {
    const { r, g, b } = color.rgb;

    updateColorMap([r / 255, g / 255, b / 255]);
  };

  return (
    <>
      <Box
        onClick={handleOpenColorPicker}
        sx={{
          width: 20,
          height: 16,
          backgroundColor: rgbToHex(colorMap),
          borderRadius: 0.5,
          cursor: "pointer",
          mr: 2,
        }}
      />
      {showColorPicker && channelColorRef && (
        <Popover
          anchorEl={channelColorRef}
          open={showColorPicker}
          onClose={handleCloseColorPicker}
        >
          <ChromePicker
            color={draftColorMap}
            onChange={handleColorChange}
            onChangeComplete={handleCommitColorChange}
            disableAlpha
          />
        </Popover>
      )}
    </>
  );
};

export const ChannelHeader = ({
  channelMeta,
  toggleSettings,
}: {
  channelMeta: ChannelMeta;
  toggleSettings: () => void;
}) => {
  const dispatch = useDispatch();

  const handleSetVisibility = (visible: boolean) => {
    dispatch(
      dataSlice.actions.updateChannelMeta({
        id: channelMeta.id,
        changes: { visible },
      }),
    );
  };

  const handleUpdateColorMap = (colorMap: ColorMap) => {
    dispatch(
      dataSlice.actions.updateChannelMeta({
        id: channelMeta.id,
        changes: { colorMap },
      }),
    );
  };

  return (
    <Box
      sx={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        py: 1,
      }}
    >
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
        }}
      >
        <ColorPicker
          colorMap={channelMeta.colorMap}
          updateColorMap={handleUpdateColorMap}
        />
        <Typography
          variant="body1"
          sx={{ fontSize: "0.825rem", fontWeight: "bold" }}
        >
          {channelMeta.name}
        </Typography>
      </Box>
      <Box
        sx={{
          display: "flex",

          alignItems: "center",
        }}
      >
        <Checkbox
          size="small"
          checked={channelMeta.visible}
          sx={{ p: 0, mr: 2 }}
          onChange={(event) => handleSetVisibility(event.target.checked)}
        />
        <IconButton onClick={toggleSettings} sx={{ p: 0 }}>
          <Settings fontSize="small" />
        </IconButton>
      </Box>
    </Box>
  );
};
