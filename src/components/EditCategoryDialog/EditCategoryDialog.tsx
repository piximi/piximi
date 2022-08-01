import React, { ChangeEvent, useState } from "react";
import { useDispatch } from "react-redux";
import { useHotkeys } from "react-hotkeys-hook";

import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Grid,
  TextField,
} from "@mui/material";

import { ColorIcon } from "components/ColorIcon";

import { updateCategory } from "store/slices";

import { Category } from "types/Category";

type EditCategoryDialogProps = {
  category: Category;
  onClose: () => void;
  open: boolean;
};

export const EditCategoryDialog = ({
  category,
  onClose,
  open,
}: EditCategoryDialogProps) => {
  const dispatch = useDispatch();

  const [color, setColor] = useState<string>(category.color);

  const onColorChange = (color: any) => {
    setColor(color.hex);
  };

  const [name, setName] = useState<string>(category.name);

  const onNameChange = (event: ChangeEvent<HTMLInputElement>) => {
    setName(event.target.value);
  };

  const onEdit = () => {
    dispatch(
      updateCategory({
        id: category.id,
        name: name,
        color: color,
      })
    );

    onClose();
  };

  const onCloseDialog = () => {
    onClose();
    setName(category.name);
  };

  useHotkeys(
    "enter",
    () => {
      onEdit();
    },
    { enabled: open },
    [onEdit]
  );

  return (
    <Dialog fullWidth onClose={onCloseDialog} open={open}>
      <DialogTitle>Edit category</DialogTitle>

      <DialogContent>
        <div>
          <Grid container spacing={1}>
            <Grid item xs={2}>
              <ColorIcon color={color} onColorChange={onColorChange} />
            </Grid>
            <Grid item xs={10}>
              <TextField
                autoFocus
                fullWidth
                id="name"
                label="Name"
                margin="dense"
                onChange={onNameChange}
                value={name}
              />
            </Grid>
          </Grid>
        </div>
      </DialogContent>

      <DialogActions>
        <Button onClick={onCloseDialog} color="primary">
          Cancel
        </Button>

        <Button onClick={onEdit} color="primary">
          Update
        </Button>
      </DialogActions>
    </Dialog>
  );
};
