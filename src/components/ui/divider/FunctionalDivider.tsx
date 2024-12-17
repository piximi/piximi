import React, { ReactNode } from "react";
import { Box, Typography } from "@mui/material";

export const FunctionalDivider = ({
  headerText,
  actions,
}: {
  headerText: string;
  actions: ReactNode;
}) => {
  return (
    <Box display="flex" alignItems="center" my={1}>
      <Box
        sx={(theme) => ({
          height: 0,
          borderBottom: `thin solid ${theme.palette.divider}`,
          width: "7%",
        })}
      />
      <Typography
        sx={{
          //reapply formatting of DividerHeader
          margin: 0,
          pl: "calc(8px* 1.2)",
          pr: "calc(8px* 1.2)",
          fontFamily: '"Roboto","Helvetica","Arial",sans-serif',
          fontWeight: "400",
          fontSize: "0.875rem",
          lineHeight: "1.43",
          letterSpacing: "0.01071em",
          textTransform: "capitalize",
        }}
      >
        {headerText}
      </Typography>
      <Box
        sx={(theme) => ({
          height: 0,
          borderBottom: `thin solid ${theme.palette.divider}`,
          flexGrow: 1,
        })}
      />
      {actions}
      <Box
        sx={(theme) => ({
          height: 0,
          borderBottom: `thin solid ${theme.palette.divider}`,
          width: "5%",
        })}
      />
    </Box>
  );
};
