import Dialog from "@material-ui/core/Dialog";
import DialogTitle from "@material-ui/core/DialogTitle";
import DialogContent from "@material-ui/core/DialogContent";
import TextField from "@material-ui/core/TextField";
import DialogActions from "@material-ui/core/DialogActions";
import Button from "@material-ui/core/Button";
import React, { ChangeEvent, useState } from "react";
import { useDispatch } from "react-redux";
import { createCategoryAction } from "./store";
import { ColorIcon } from "./ColorIcon";
import Grid from "@material-ui/core/Grid";
import { useStyles } from "./index.css";

type CreateCategoryDialogProps = {
  onClose: () => void;
  open: boolean;
};

export const CreateCategoryDialog = ({
  onClose,
  open,
}: CreateCategoryDialogProps) => {
  const classes = useStyles();

  const dispatch = useDispatch();

  const [name, setName] = useState<string>("");

  const onNameChange = (event: ChangeEvent<HTMLInputElement>) => {
    setName(event.target.value);
  };

  const onCreate = () => {
    dispatch(createCategoryAction({ name: name }));

    onClose();
  };

  const [color, setColor] = React.useState<string>("#00e676");

  const onColorChange = (color: any) => {
    setColor(color.hex);
  };

  const colors = [
    "rgb(193,	 53,	19)", // r, 60s
    "rgb(248,	 52,  35)", // r, 70s
    "rgb(251,	  0,	66)", // r, 80s
    "rgb(159,	 40,	20)", // r, 90s
  ];

  return (
    <Dialog fullWidth maxWidth="xs" onClose={onClose} open={open}>
      <DialogTitle>Create category</DialogTitle>

      <DialogContent className={classes.createCategoryDialogContent}>
        <div className={classes.createCategoryDialogGrid}>
          <Grid container spacing={1} xs={12}>
            <Grid item xs={2} className={classes.createCategoryDialogItem}>
              <ColorIcon
                color={color}
                colors={colors}
                onColorChange={onColorChange}
              />
            </Grid>
            <Grid item xs={10}>
              <TextField
                autoFocus
                fullWidth
                id="name"
                label="Name"
                margin="dense"
                onChange={onNameChange}
              />
            </Grid>
          </Grid>
        </div>
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose} color="primary">
          Cancel
        </Button>

        <Button onClick={onCreate} color="primary">
          Create
        </Button>
      </DialogActions>
    </Dialog>
  );
};
