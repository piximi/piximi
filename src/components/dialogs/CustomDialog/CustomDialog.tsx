import {
  Dialog,
  DialogActions,
  DialogContent,
  Toolbar,
  Typography,
} from "@mui/material";

type CustomDialogProps = {
  onClose: () => void;
  open: boolean;
  title: string;
  content: React.ReactNode;
  actions?: React.ReactNode;
};

export const CustomDialog = ({
  onClose,
  open,
  title,
  content,
  actions,
}: CustomDialogProps) => {
  return (
    <Dialog fullWidth onClose={onClose} open={open}>
      <Toolbar sx={{ backgroundColor: "inherit" }}>
        <Typography sx={{ flexGrow: 1 }} variant="h6">
          {title}
        </Typography>
      </Toolbar>

      <DialogContent sx={{ marginTop: (theme) => theme.spacing(2) }}>
        {content}
      </DialogContent>
      <DialogActions>{actions}</DialogActions>
    </Dialog>
  );
};
