import { AppBar, IconButton, Toolbar, Typography } from "@mui/material";
import { Close } from "@mui/icons-material";
type DialogTitleBarProps = {
  title?: string;
  closeDialog: (
    event?: object,
    reason?: "backdropClick" | "escapeKeyDown",
  ) => void;
};

export const DialogTitleBar = ({ title, closeDialog }: DialogTitleBarProps) => {
  return (
    <AppBar
      sx={{
        position: "sticky",
        backgroundColor: "transparent",
        boxShadow: "none",
        borderBottom: `1px solid var(--mui-palette-divider)`,
      }}
    >
      <Toolbar variant="dense">
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

        {title && <Typography variant="h6">{title}</Typography>}
      </Toolbar>
    </AppBar>
  );
};
