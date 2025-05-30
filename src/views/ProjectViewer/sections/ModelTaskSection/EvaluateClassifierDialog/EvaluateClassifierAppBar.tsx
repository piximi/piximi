import { AppBar, IconButton, Toolbar, Typography } from "@mui/material";
import { Close } from "@mui/icons-material";

import { APPLICATION_COLORS } from "utils/constants";

type FitClassifierDialogAppBarProps = {
  closeDialog: any;
};

export const EvaluateClassifierDialogAppBar = ({
  closeDialog,
}: FitClassifierDialogAppBarProps) => {
  return (
    <AppBar
      sx={{
        position: "sticky",
        backgroundColor: "transparent",
        boxShadow: "none",
        borderBottom: `1px solid ${APPLICATION_COLORS.borderColor}`,
      }}
    >
      <Toolbar
        sx={{
          display: "flex",
          justifyContent: "center",
        }}
      >
        <IconButton
          edge="start"
          color="primary"
          onClick={closeDialog}
          aria-label="Close"
          sx={{
            position: "absolute",
            right: 8,
            my: "auto",
          }}
        >
          <Close />
        </IconButton>

        <Typography variant="h4">Model Evaluation</Typography>
      </Toolbar>
    </AppBar>
  );
};
