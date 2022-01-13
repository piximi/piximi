import React from "react";
import { Typography } from "@mui/material";
import AppBar from "@mui/material/AppBar";
import Toolbar from "@mui/material/Toolbar";

type InformationBoxProps = {
  description: string;
  name: string;
};

export const InformationBox = ({ description, name }: InformationBoxProps) => {
  return (
    <AppBar
      sx={{
        backgroundColor: "rgba(0, 0, 0, 0)",
        borderBottom: "1px solid rgba(0, 0, 0, 0.12)",
        boxShadow: "none",
        position: "absolute",
      }}
      color="default"
    >
      <Toolbar disableGutters={true}>
        <Typography variant="h6" color="inherit">
          &nbsp;
        </Typography>
        <Typography style={{ marginLeft: 12 }}>{name}</Typography>
      </Toolbar>
    </AppBar>
  );
};
