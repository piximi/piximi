import React, { ReactNode, useRef } from "react";
import { usePlotControl } from "../hooks";
import { toPng } from "html-to-image";
import saveAs from "file-saver";
import { Box, Button } from "@mui/material";
import { usePreferredNivoTheme } from "hooks";

export const PlotContainer = ({ children }: { children: ReactNode }) => {
  const plotRef = useRef<HTMLDivElement | null>(null);
  const { selectedPlot } = usePlotControl();
  const theme = usePreferredNivoTheme();
  const handleSave = async () => {
    if (!plotRef.current) return;
    const data = await toPng(plotRef.current);
    const blob = new Blob([data], { type: "image/png" });
    saveAs(blob, `${selectedPlot.name}`);
  };
  return (
    <Box width="100%" height="100%" sx={{ backgroundColor: theme.background }}>
      <Box width="100%" height="90%" ref={plotRef}>
        {children}
      </Box>
      <Button
        variant="text"
        sx={{ position: "relative", right: 0 }}
        onClick={handleSave}
      >
        Save to PNG
      </Button>
    </Box>
  );
};
