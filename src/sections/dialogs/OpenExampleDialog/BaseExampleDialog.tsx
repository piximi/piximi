import { ReactElement } from "react";
import {
  Box,
  Dialog,
  DialogContent,
  DialogTitle,
  IconButton,
  useTheme,
} from "@mui/material";

import { useTranslation } from "hooks";

import CloseIcon from "@mui/icons-material/Close";

type BaseExampleDialogProps = {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactElement;
};

export const BaseExampleDialog = ({
  open,
  onClose,
  title,
  children,
}: BaseExampleDialogProps) => {
  const theme = useTheme();
  const t = useTranslation();

  return (
    <Dialog fullWidth maxWidth="md" open={open} onClose={onClose}>
      <DialogTitle
        sx={{
          borderBottom: (theme) => `1px solid ${theme.palette.divider}`,
          margin: 0,
          padding: (theme) => theme.spacing(2),
        }}
      >
        {t(title)}
        <IconButton
          aria-label="Close"
          sx={(theme) => ({
            color: theme.palette.grey[500],
            position: "absolute",
            right: theme.spacing(1),
            top: theme.spacing(1),
          })}
          onClick={onClose}
        >
          <CloseIcon />
        </IconButton>
      </DialogTitle>
      <DialogContent
        sx={{
          borderTop: (theme) => `1px solid ${theme.palette.divider}`,
          margin: 0,
          padding: (theme) => theme.spacing(1),
        }}
      >
        <Box
          display="flex"
          flexDirection="row"
          flexWrap="wrap"
          justifyContent="space-evenly"
          padding={theme.spacing(2)}
          gap={theme.spacing(2)}
        >
          {children}
        </Box>
      </DialogContent>
    </Dialog>
  );
};
