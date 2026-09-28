import { IconButton, Tooltip } from "@mui/material";
import { HelpOutline as HelpIcon } from "@mui/icons-material";

import { useHelp } from "contexts";

export const HelpButton = () => {
  const { setHelpMode, helpMode } = useHelp();

  return (
    <>
      <Tooltip title="Toggle Help Mode">
        <IconButton
          onClick={() => setHelpMode((helpMode) => !helpMode)}
          size="small"
          color={helpMode ? "primary" : "default"}
        >
          <HelpIcon />
        </IconButton>
      </Tooltip>
    </>
  );
};
