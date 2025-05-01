import React, { ReactElement } from "react";
import { Box, Drawer, Typography } from "@mui/material";

import { useTranslation } from "hooks";

import { AppBarOffset } from "components/ui/AppBarOffset";
import { dimensions } from "utils/constants";

export type OperationType = {
  icon: (color: string) => ReactElement;
  name: string;
  description: string;
  options: ReactElement;
  hotkey: string;
  mobile?: boolean;
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
      sx={(theme) => ({
        flexShrink: 0,
        "& .MuiDrawer-paper": {
          width: 240,
          right: dimensions.toolDrawerWidth,
          zIndex: 99,
          pt: theme.spacing(1),
        },
      })}
      variant="persistent"
      open={optionsVisibility}
    >
      <AppBarOffset />
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
              {t(toolType?.name)}
            </Typography>
          </Box>
          {toolType!.options}
        </>
      )}
    </Drawer>
  );
};
