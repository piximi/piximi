import React, { ChangeEvent, useState } from "react";
import { useDispatch } from "react-redux";
import { useHotkeys } from "hooks";

import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Grid,
  TextField,
} from "@mui/material";

import { ColorIcon } from "components/common/ColorIcon";
import { dataSlice } from "store/data";
import { Category, CategoryType, HotkeyView } from "types";

type EditCategoryDialogProps = {
  category: Category;
  categoryType: CategoryType;
  onClose: () => void;
  open: boolean;
};

export const EditCategoryDialog = ({
  category,
  categoryType,
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
    if (categoryType === CategoryType.ClassifierCategory) {
      dispatch(
        dataSlice.actions.updateCategory({
          id: category.id,
          name: name,
          color: color,
        })
      );
    } else {
      dispatch(
        dataSlice.actions.updateAnnotationCategory({
          id: category.id,
          name: name,
          color: color,
        })
      );
    }

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
    HotkeyView.EditCategoryDialog,
    { enableOnTags: ["INPUT"] },

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
