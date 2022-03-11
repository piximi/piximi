import React from "react";
import { Box } from "@mui/material";

type KeyboardKeyProps = {
  letter: string;
};
export const KeyboardKey = ({ letter }: KeyboardKeyProps) => {
  return (
    <Box
      sx={{
        backgroundColor: "rgba(237, 242, 247, 1)",
        borderWidth: "1px 1px 3px",
        borderRadius: "6px",
        fontSize: "0.8em",
        paddingInline: "0.4em",
        whiteSpace: "nowrap",
        fontWeight: 700,
        borderColor: "rgba(184, 186, 189, 1)",
        borderStyle: "solid",
        color: "rgba(45, 55, 72, 1)",
        width: "fit-content",
        lineHeight: "revert",
        marginLeft: "5px",
        marginRight: "5px",
      }}
    >
      {letter}
    </Box>
  );
};
