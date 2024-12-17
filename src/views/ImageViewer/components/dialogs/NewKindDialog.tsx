import { useEffect, useState } from "react";
import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  TextField,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";

export const NewKindDialog = ({
  open,
  onConfirm,
  onReject,
}: {
  open: boolean;
  onConfirm: (kindName: string, catName?: string) => void;
  onReject: (reason: string) => void;
}) => {
  const [kindName, setKindName] = useState<string>("");
  const [userTyped, setUserTyped] = useState<boolean>(false);
  const [categoryName, setCategoryName] = useState<string>("");
  const [error, setError] = useState<string>();
  const handleKindChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setKindName(e.target.value);
  };
  const handleCategoryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCategoryName(e.target.value);
  };

  const handleConfirm = () => {
    if (!error) {
      const catName = categoryName.length > 0 ? categoryName : undefined;
      onConfirm(kindName, catName);
    }
  };

  // useEffect(() => {
  //   if (!userTyped && kindName.length !== 0) {
  //     setUserTyped(true);
  //   }
  // }, [kindName,userTyped]);

  useEffect(() => {
    if (!userTyped && kindName.length !== 0) {
      setUserTyped(true);
    } else if (userTyped && kindName.length === 0) {
      setError("Kind name cannot be blank");
    } else {
      setError(undefined);
    }
  }, [userTyped, kindName]);
  return (
    <>
      <Dialog
        fullWidth
        onClose={(event, reason) => onReject(reason)}
        open={open}
      >
        <Box
          display="flex"
          justifyContent="space-between"
          alignItems="center"
          px={1}
          pb={1.5}
          pt={1}
        >
          <DialogTitle sx={{ p: 1 }}>Create New Kind</DialogTitle>
          <IconButton
            onClick={() => onReject("cancelled")}
            sx={{
              maxHeight: "40px",
            }}
          >
            <CloseIcon />
          </IconButton>
        </Box>

        <DialogContent>
          <Box
            display="flex"
            flexDirection="row"
            justifyContent="space-between"
            alignItems={"center"}
            gap={2}
          >
            <TextField
              error={!!error}
              helperText={error}
              autoFocus
              fullWidth
              label="Kind Name"
              margin="dense"
              variant="standard"
              value={kindName}
              onChange={handleKindChange}
            />
            <TextField
              placeholder="Unknown"
              fullWidth
              label="Category Name"
              value={categoryName}
              margin="dense"
              variant="standard"
              onChange={handleCategoryChange}
            />
          </Box>
        </DialogContent>

        <DialogActions>
          <Button onClick={() => onReject("cancelled")} color="primary">
            Cancel
          </Button>

          <Button
            onClick={handleConfirm}
            color="primary"
            variant="contained"
            disabled={!!error}
          >
            Create Kind
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};
