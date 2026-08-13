import { useEffect, useRef, useState } from "react";

import type { ColorResult } from "react-color";
import { ChromePicker } from "react-color";
import { useDispatch } from "react-redux";

import { Box, Checkbox, IconButton, Popover, Typography } from "@mui/material";
import { Settings } from "@mui/icons-material";

import { dataSlice } from "store/data";
import type { ChannelMeta, ColorMap } from "store/data/types";

import { rgbToHex } from "utils/colorUtils";

const ColorPicker = ({
  colorMap,
  updateColorMap,
}: {
  colorMap: ColorMap;
  updateColorMap: (color: ColorMap) => void;
}) => {
  const channelColorRef = useRef<HTMLDivElement | null>(null);
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [selectedColor, setSelectedColor] = useState(rgbToHex(colorMap));
  const handleOpenColorPicker = (
    event: React.MouseEvent<HTMLDivElement, MouseEvent>,
  ) => {
    channelColorRef.current = event.currentTarget;
    setShowColorPicker(true);
  };
  const handleCloseColorPicker = () => {
    channelColorRef.current = null;
    setShowColorPicker(false);
  };

  const handleColorChange = (color: ColorResult) => {
    if (channelColorRef.current) {
      setSelectedColor(color.hex);
    }
  };

  const handleCommitColorChange = (color: ColorResult) => {
    const { r, g, b } = color.rgb;

    updateColorMap([r / 255, g / 255, b / 255]);
  };

  useEffect(() => {
    setSelectedColor(rgbToHex(colorMap));
  }, [colorMap]);

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
      {showColorPicker && channelColorRef.current && (
        <Popover
          anchorEl={channelColorRef.current}
          open={showColorPicker && !!channelColorRef.current}
          onClose={handleCloseColorPicker}
        >
          <ChromePicker
            color={selectedColor}
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
