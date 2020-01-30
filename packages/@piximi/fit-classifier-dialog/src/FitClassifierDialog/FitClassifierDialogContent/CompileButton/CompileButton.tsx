import Button from "@material-ui/core/Button/Button";
import {
  compileAction,
  compileOptionsSelector,
  openedSelector
} from "@piximi/store";
import * as React from "react";
import {useCallback} from "react";
import {useDispatch, useSelector} from "react-redux";

import {useStyles} from "./CompileButton.css";

export const CompileButton = ({next}: {next: any}) => {
  const dispatch = useDispatch();

  const onClick = useCallback(() => {
    const payload = {opened: opened, options: options};

    dispatch(compileAction(payload));

    next();
  }, [dispatch]);

  const opened = useSelector(openedSelector);

  const options = useSelector(compileOptionsSelector);

  const classes = useStyles({});

  return (
    <Button
      className={classes.button}
      color="primary"
      onClick={onClick}
      variant="contained"
    >
      Compile
    </Button>
  );
};
