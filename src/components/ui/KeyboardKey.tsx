import { Fragment } from "react/jsx-runtime";

import { Box } from "@mui/material";

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
