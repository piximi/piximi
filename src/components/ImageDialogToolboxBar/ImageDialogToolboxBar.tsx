import React from "react";

import {
  AppBar,
  Box,
  Button,
  IconButton,
  Toolbar,
  Typography,
} from "@mui/material";

import {
  Brush as BrushIcon,
  Crop32 as Crop32Icon,
  PanTool as PanToolIcon,
} from "@mui/icons-material";

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
