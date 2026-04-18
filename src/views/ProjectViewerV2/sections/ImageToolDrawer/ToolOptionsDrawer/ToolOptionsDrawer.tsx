import React, { ReactElement } from "react";
import { Box, Drawer, Typography } from "@mui/material";

import { useTranslation } from "hooks";

import { DIMENSIONS } from "utils/constants";
import { HelpItem } from "components/layout/HelpDrawer/HelpContent";

export type OperationType = {
  icon: (color: string) => ReactElement;
  name: string;
  description: string;
  options?: ReactElement;
  action?: () => void;
  hotkey: string;
  mobile?: boolean;
  helpContext?: HelpItem;
};
export const ToolOptionsDrawer = ({
  optionsVisibility,
  toolType,
}: {
  optionsVisibility: boolean;
  toolType: OperationType | undefined;
}) => {
  const t = useTranslation();

  return (
    <Drawer
      anchor="right"
      sx={{
        position: "absolute",
        flexShrink: 0,
        "& .MuiDrawer-paper": {
          width: 240,
          right: DIMENSIONS.toolDrawerWidth,
          zIndex: 99,
          pt: DIMENSIONS.toolDrawerWidth + "px",
        },
      }}
      variant="persistent"
      open={optionsVisibility}
    >
      {toolType && (
        <>
          <Box
            width={"100%"}
            sx={(theme) => ({
              borderBottom: "1px solid " + theme.palette.text.primary,
              mb: theme.spacing(1),
            })}
          >
            <Typography
              variant="h5"
              sx={{
                textTransform: "capitalize",
                marginInline: "auto",
                maxWidth: "fit-content",
              }}
              gutterBottom
            >
              {t(toolType.name)}
            </Typography>
          </Box>
          {toolType!.options}
        </>
      )}
    </Drawer>
  );
};
