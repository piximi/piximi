import Button from "@material-ui/core/Button/Button";
import {openAction} from "@piximi/store";
import * as React from "react";
import {useCallback} from "react";
import {useDispatch} from "react-redux";

import {useStyles} from "./OpenButton.css";

const pathname =
  "https://storage.googleapis.com/tfjs-models/tfjs/mobilenet_v1_0.25_224/model.json";

export const OpenButton = ({next}: {next: any}) => {
  const dispatch = useDispatch();

  const onClick = useCallback(() => {
    const payload = {pathname: pathname, classes: 10, units: 100};

    dispatch(openAction(payload));

    next();
  }, [dispatch]);

  const classes = useStyles({});

  return (
    <Button
      className={classes.button}
      color="primary"
      onClick={onClick}
      variant="contained"
    >
      Open
    </Button>
  );
};
