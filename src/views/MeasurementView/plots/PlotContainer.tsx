import React, { ReactNode, useMemo, useRef } from "react";
import saveAs from "file-saver";
import { Box, Button } from "@mui/material";

import { usePreferredNivoTheme } from "hooks";
import { usePlotControl } from "../hooks";

export const PlotContainer = ({ children }: { children: ReactNode }) => {
  const plotRef = useRef<HTMLDivElement | null>(null);
  const { selectedPlot } = usePlotControl();
  const theme = usePreferredNivoTheme();
  const parser = useMemo(() => new DOMParser(), []);
  const serializer = useMemo(() => new XMLSerializer(), []);
  const handleSave = () => {
    if (!plotRef.current) return;
    const data = parser.parseFromString(
      plotRef.current.innerHTML,
      "image/svg+xml"
    );
    const errorNode = data.querySelector("parsererror");
    if (errorNode) {
      throw new Error(errorNode.textContent || "Unknown error parsing svg");
    }

    const svgData = data.getElementsByTagName("svg")[0];

    const img = new Image();
    const svgStr = serializer.serializeToString(svgData);

    img.src = "data:image/svg+xml;base64," + window.btoa(svgStr);

    const canvas = document.createElement("canvas");
    const width = Math.round(+svgData.getAttribute("width")!);
    const height = Math.round(+svgData.getAttribute("height")!);
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d");

    if (!ctx) {
      return;
    }
    img.onload = () => {
      ctx.drawImage(img, 0, 0, width, height);

      const url = canvas.toDataURL("image/png");
      saveAs(url, `${selectedPlot.name}`);
    };
  };

  return (
    <Box
      display="flex"
      flexDirection="column"
      width="100%"
      height="100%"
      sx={{ backgroundColor: theme.background }}
    >
      <Box width="100%" height="90%" ref={plotRef}>
        {children}
      </Box>
      <Button
        variant="text"
        sx={{ alignSelf: "flex-end", mr: 1 }}
        onClick={handleSave}
      >
        Save to PNG
      </Button>
    </Box>
  );
};
