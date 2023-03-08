import React from "react";

import { Box, Typography } from "@mui/material";

type KeyboardKeyProps = {
  letter: string;
};
export const KeyboardKey = ({ letter }: KeyboardKeyProps) => {
  return (
    <Box
      sx={{
        display: "flex",
        alignItems: "center",
        width: "fit-content",
        mx: "5px",
        backgroundColor: "rgba(237, 242, 247, 1)",
        border: "1px solid rgba(184, 186, 189, 1)",
        borderRadius: "6px",
        px: "0.4em",
        whiteSpace: "nowrap",
      }}
    >
      <Typography
        color="rgba(45, 55, 72, 1)"
        fontWeight={700}
        fontSize="0.75rem"
      >
        {letter}
      </Typography>
    </Box>
  );
};
