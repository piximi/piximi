import Dialog from "@material-ui/core/Dialog";
import DialogTitle from "@material-ui/core/DialogTitle";
import DialogContent from "@material-ui/core/DialogContent";
import TextField from "@material-ui/core/TextField";
import DialogActions from "@material-ui/core/DialogActions";
import Button from "@material-ui/core/Button";
import React, { ChangeEvent, useState } from "react";
import { useDispatch } from "react-redux";
import Grid from "@material-ui/core/Grid";
import { ColorIcon } from "../../../ColorIcon";
import { useStyles } from "../../../../index.css";
import { Category } from "../../../../types/Category";
import { updateCategoryAction } from "../../../../store/slices";

type EditCategoryDialogProps = {
  category: Category;
  onCloseDialog: () => void;
  openDialog: boolean;
};

export const EditCategoryDialog = ({
  category,
  onCloseDialog,
  openDialog,
}: EditCategoryDialogProps) => {
  const dispatch = useDispatch();

  const classes = useStyles();

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
      updateCategoryAction({
        id: category.id,
        name: name,
        color: color,
      })
    );

    onCloseDialog();
  };

  return (
    <Dialog fullWidth onClose={onCloseDialog} open={openDialog}>
      <DialogTitle>Edit category</DialogTitle>

      <DialogContent>
        <div>
          <Grid container spacing={1} xs={12}>
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
