import React, { CSSProperties, ReactNode } from "react";
import { Box, Typography, TypographyProps } from "@mui/material";

export const HalfDivider = ({
  headerText,
  containerStyle,
  typographyVariant,
  textTransform,
}: {
  headerText: string;
  containerStyle?: CSSProperties;
  typographyVariant?: TypographyProps["variant"];
  textTransform?: TypographyProps["textTransform"];
}) => {
  return (
    <Box
      sx={{ display: "flex", alignItems: "center", my: 1, ...containerStyle }}
    >
      <Box
        sx={(theme) => ({
          height: 0,
          borderBottom: `thin solid ${theme.palette.divider}`,
          width: "7%",
        })}
      />
      <Typography
        variant={typographyVariant ?? "body2"}
        textTransform={textTransform ?? "capitalize"}
        sx={{
          //reapply formatting of DividerHeader
          margin: 0,
          pl: "calc(8px* 1.2)",
          pr: "calc(8px* 1.2)",
          fontFamily: '"Roboto","Helvetica","Arial",sans-serif',
          fontWeight: "400",
          lineHeight: "1.43",
          letterSpacing: "0.01071em",
        }}
      >
        {headerText}
      </Typography>
      <Box
        sx={(theme) => ({
          height: 0,
          flexGrow: 1,
        })}
      />
    </Box>
  );
};
