import type React from "react";

import { useDispatch } from "react-redux";

import { Box, Button, TextField, Typography } from "@mui/material";

import type { BitDepth } from "store/data/types";
import { dataSliceV2 } from "store/data";

export const PlotOptions = ({
  channelMetaId,
  bitDepth,
  plotMin,
  plotMax,
}: {
  channelMetaId: string;
  bitDepth: BitDepth;
  plotMin: number;
  plotMax: number;
}) => {
  const dispatch = useDispatch();
  const handleChangeMinLimit = (event: React.ChangeEvent<HTMLInputElement>) => {
    const newMinLim = +event.currentTarget.value;
    if (!Number.isInteger(newMinLim) || newMinLim < 0) return;

    dispatch(
      dataSliceV2.actions.updateChannelMeta({
        id: channelMetaId,
        changes: { rampMinLimit: newMinLim },
      }),
    );
  };

  const handleChangeMaxLimit = (event: React.ChangeEvent<HTMLInputElement>) => {
    const newMaxLim = +event.currentTarget.value;
    if (!Number.isInteger(newMaxLim) || newMaxLim > 2 ** bitDepth - 1) return;
    dispatch(
      dataSliceV2.actions.updateChannelMeta({
        id: channelMetaId,
        changes: { rampMaxLimit: newMaxLim },
      }),
    );
  };

  const handleUseFullRange = () => {
    dispatch(
      dataSliceV2.actions.updateChannelMeta({
        id: channelMetaId,
        changes: {
          rampMinLimit: 0,
          rampMaxLimit: 2 ** bitDepth - 1,
        },
      }),
    );
  };
  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        pb: 1,
        mb: 1,
      }}
    >
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          pt: 1,
          px: 1,
        }}
      >
        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <Typography variant="body2">Plot limits:</Typography>
          <Box
            sx={{
              display: "flex",
              gap: 1,
              justifyContent: "flex-end",
              alignItems: "center",
            }}
          >
            <TextField
              size="small"
              value={plotMin}
              onChange={handleChangeMinLimit}
              slotProps={{
                htmlInput: {
                  style: {
                    paddingBlock: "2px",
                    paddingInline: "4px",
                    fontSize: "1rem",
                  },
                },
              }}
              sx={{ width: "6ch" }}
            />

            <TextField
              size="small"
              value={plotMax}
              onChange={handleChangeMaxLimit}
              slotProps={{
                htmlInput: {
                  style: {
                    paddingBlock: "2px",
                    paddingInline: "4px",
                    fontSize: "1rem",
                  },
                },
              }}
              sx={{ width: "6ch" }}
            />
          </Box>
        </Box>
        <Button variant="text" onClick={handleUseFullRange} sx={{ p: 0 }}>
          <Typography variant="caption">full range</Typography>
        </Button>
      </Box>
    </Box>
  );
};
