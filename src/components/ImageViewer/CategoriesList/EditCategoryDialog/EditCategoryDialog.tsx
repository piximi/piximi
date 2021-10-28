import Dialog from "@mui/material/Dialog";
import DialogTitle from "@mui/material/DialogTitle";
import DialogContent from "@mui/material/DialogContent";
import TextField from "@mui/material/TextField";
import DialogActions from "@mui/material/DialogActions";
import Button from "@mui/material/Button";
import React, { ChangeEvent, useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import Grid from "@mui/material/Grid";
import { ColorIcon } from "../ColorIcon";
import { useStyles } from "./EditCategoryDialog.css";
import { CategoryType } from "../../../../annotator/types/CategoryType";
import { applicationSlice } from "../../../../annotator/store";
import {
  categoriesSelector,
  selectedCategorySelector,
} from "../../../../annotator/store/selectors";

type EditCategoryDialogProps = {
  onCloseDialog: () => void;
  openDialog: boolean;
};

export const EditCategoryDialog = ({
  onCloseDialog,
  openDialog,
}: EditCategoryDialogProps) => {
  const dispatch = useDispatch();

  const category = useSelector(selectedCategorySelector);

  const classes = useStyles();

  const [color, setColor] = useState<string>(category.color);

  const onColorChange = (color: any) => {
    setColor(color.hex);
  };

  useEffect(() => {
    setName(category.name);
    setColor(category.color);
  }, [category]);

  const [name, setName] = useState<string>(category.name);

  const onNameChange = (event: ChangeEvent<HTMLInputElement>) => {
    setName(event.target.value);
  };

  const categories = useSelector(categoriesSelector);

  const onEdit = () => {
    const updatedCategories = categories?.map((v: CategoryType) => {
      if (v.id === category.id) {
        return {
          ...category,
          color: color,
          name: name,
        };
      } else {
        return v;
      }
    });
    dispatch(
      applicationSlice.actions.setCategories({ categories: updatedCategories })
    );

    onCloseDialog();
  };

  return (
    <Dialog fullWidth onClose={onCloseDialog} open={openDialog}>
      <DialogTitle>Edit category</DialogTitle>

      <DialogContent>
        <div>
          <Grid container spacing={1}>
            <Grid item xs={2} className={classes.createCategoryDialogItem}>
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
