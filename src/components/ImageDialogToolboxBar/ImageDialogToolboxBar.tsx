import React from "react";

import { AppBar, Button, Toolbar, Box } from "@mui/material";
import IconButton from "@mui/material/IconButton";

import Typography from "@mui/material/Typography";
import BrushIcon from "@mui/icons-material/Brush";
import Crop32Icon from "@mui/icons-material/Crop32";
import PanToolIcon from "@mui/icons-material/PanTool";

export const ImageDialogToolboxBar = () => {
  return (
    <Box sx={{ flexGrow: 1, paddingBottom: "50px;" }}>
      <AppBar position="sticky" color="inherit">
        <Toolbar>
          <Typography color="inherit" style={{ paddingRight: 20 }} />
          <IconButton color="inherit" onClick={() => {}}>
            <BrushIcon />
          </IconButton>
          <IconButton color="inherit" onClick={() => {}}>
            <Crop32Icon />
          </IconButton>
          <Box sx={{ flexGrow: 1 }} />
          <IconButton color="inherit" onClick={() => {}}>
            <PanToolIcon />
          </IconButton>
          <Button />
        </Toolbar>
      </AppBar>
    </Box>
  );
};
