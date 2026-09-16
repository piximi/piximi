import { Box, Typography } from "@mui/material";

import { HotkeyTitle } from "components/ui/KeyboardKey";

type ToolHotkeyTitleProps = {
  toolName: string;
  hotkey?: string[];
  bold?: boolean;
};
export const ToolHotkeyTitle = ({
  toolName,
  hotkey,
  bold,
}: ToolHotkeyTitleProps) => {
  return (
    <Box sx={{ display: "flex", alignItems: "center" }}>
      <Typography
        fontWeight={bold ? "fontWeightBold" : ""}
        fontSize={"0.7rem"}
        sx={{ mr: hotkey ? 1 : 0 }}
      >
        {toolName}
      </Typography>
      {hotkey && <HotkeyTitle hotkey={hotkey} />}
    </Box>
  );
};
