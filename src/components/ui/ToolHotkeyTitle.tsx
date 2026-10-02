import { Fragment } from "react/jsx-runtime";

import { Box, Typography } from "@mui/material";

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

export const HotkeyTitle = ({ hotkey }: { hotkey: string[] }) => {
  return (
    <Box sx={{ display: "flex", alignItems: "center", fontSize: "inherit" }}>
      {hotkey.map((key, idx) =>
        idx < hotkey.length - 1 ? (
          <Fragment key={`${hotkey.join(",")}-${key}`}>
            <Key hkey={key} /> <Box sx={{ py: 0, px: 0.5 }}>+</Box>
          </Fragment>
        ) : (
          <Key key={`${hotkey.join(",")}-${key}`} hkey={key} />
        ),
      )}
    </Box>
  );
};
export const Key = ({ hkey }: { hkey: string }) => {
  return (
    <Box
      sx={{
        py: 0,
        px: 0.5,
        border: "1px solid var(--mui-palette-text-primary)",
        borderRadius: 1,
        textTransform: "capitalize",
      }}
    >
      {hkey}
    </Box>
  );
};
