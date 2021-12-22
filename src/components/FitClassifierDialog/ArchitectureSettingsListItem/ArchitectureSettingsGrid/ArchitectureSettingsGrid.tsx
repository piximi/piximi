import {
  FormControl,
  Grid,
  TextField,
  InputBase,
  Alert,
  Theme,
  Dialog,
} from "@mui/material";
import Autocomplete from "@mui/material/Autocomplete";
import * as React from "react";
import { useDispatch, useSelector } from "react-redux";
import { classifierSlice } from "../../../../store/slices";
import { architectureOptionsSelector } from "../../../../store/selectors/architectureOptionsSelector";
import { inputShapeSelector } from "../../../../store/selectors/inputShapeSelector";
import { useStyles } from "../../FitClassifierDialog/FitClassifierDialog.css";
import {
  availableModels,
  ClassifierModelProps,
} from "../../../../types/ClassifierModelType";
import { SyntheticEvent } from "react";
import { uploadedModelSelector } from "../../../../store/selectors/uploadedModelSelector";

//import { createStyles, makeStyles } from "@mui/styles";

// const useStyles = makeStyles((theme: Theme) =>
//   createStyles({
//     textField: {
//       marginRight: theme.spacing(1),
//       flexBasis: 300,
//       width: "100%",
//     },
//   })
// );

export const ArchitectureSettingsGrid = () => {
  const architectureOptions = useSelector(architectureOptionsSelector);
  const userUploadedModel = useSelector(uploadedModelSelector);
  const inputShape = useSelector(inputShapeSelector);

  const [selectedModel, setSelectedModel] =
    React.useState<ClassifierModelProps>(architectureOptions.selectedModel);

  const [fixedNumberOfChannels, setFixedNumberOfChannels] =
    React.useState<boolean>(false);
  const [fixedNumberOfChannelsHelperText, setFixedNumberOfChannelsHelperText] =
    React.useState<string>("");

  const dispatch = useDispatch();

  const classes = useStyles();

  const modelOptions: ClassifierModelProps[] = availableModels.slice();

  if (userUploadedModel) {
    modelOptions.push(userUploadedModel);
  }

  React.useEffect(() => {
    if (selectedModel.requiredChannels) {
      setFixedNumberOfChannels(true);
      setFixedNumberOfChannelsHelperText(
        `${selectedModel.modelName} requires ${selectedModel.requiredChannels} channels!`
      );
    } else {
      setFixedNumberOfChannels(false);
      setFixedNumberOfChannelsHelperText("");
    }
  }, [selectedModel]);

  const onSelectedModelChange = (
    event: SyntheticEvent<Element, Event>,
    value: ClassifierModelProps | null
  ) => {
    const selectedModel = value as ClassifierModelProps;
    setSelectedModel(selectedModel);

    // if the selected model requires a specific number of input channels, dispatch that number to the store
    if (selectedModel.requiredChannels) {
      dispatch(
        classifierSlice.actions.updateInputShape({
          inputShape: {
            ...inputShape,
            channels: selectedModel.requiredChannels,
          },
        })
      );
    }

    dispatch(
      classifierSlice.actions.updateSelectedModel({ model: selectedModel })
    );
  };

  const onRowsChange = (event: React.FormEvent<EventTarget>) => {
    const target = event.target as HTMLInputElement;
    const rows = Number(target.value);
    dispatch(
      classifierSlice.actions.updateInputShape({
        inputShape: { ...inputShape, height: rows },
      })
    );
  };

  const onColsChange = (event: React.FormEvent<EventTarget>) => {
    const target = event.target as HTMLInputElement;
    const cols = Number(target.value);
    dispatch(
      classifierSlice.actions.updateInputShape({
        inputShape: { ...inputShape, width: cols },
      })
    );
  };

  const onChannelsChange = (event: React.FormEvent<EventTarget>) => {
    const target = event.target as HTMLInputElement;
    const channels = Number(target.value);

    dispatch(
      classifierSlice.actions.updateInputShape({
        inputShape: { ...inputShape, channels: channels },
      })
    );
  };

  return (
    <FormControl className={classes.container} sx={{ m: 1, minWidth: 120 }}>
      <Grid container spacing={2}>
        <Grid item xs={2}>
          <Autocomplete
            disableClearable={true}
            options={modelOptions}
            onChange={onSelectedModelChange}
            getOptionLabel={(option: ClassifierModelProps) => option.modelName}
            sx={{ width: 300 }}
            renderInput={(params) => (
              <TextField
                {...params}
                autoComplete="off"
                label="Model architecture"
              />
            )}
            value={selectedModel}
          />
        </Grid>
      </Grid>
      <Grid container direction={"row"} spacing={2}>
        <Grid item xs={1}>
          <TextField
            id="shape-rows"
            label="Input rows"
            className={classes.textField}
            value={inputShape.height}
            onChange={onRowsChange}
          />
        </Grid>
        <Grid item xs={1}>
          <TextField
            id="shape-cols"
            label="Input cols"
            className={classes.textField}
            value={inputShape.width}
            onChange={onColsChange}
          />
        </Grid>
        <Grid item xs={1}>
          <TextField
            id="shape-channels"
            label="Input channels"
            className={classes.textField}
            value={inputShape.channels}
            onChange={onChannelsChange}
            type="number"
            disabled={fixedNumberOfChannels}
          />
        </Grid>
      </Grid>

      <Grid container spacing={1}>
        <Grid item xs={3} marginTop={1}>
          {fixedNumberOfChannels ? (
            <Alert severity="info">{fixedNumberOfChannelsHelperText}</Alert>
          ) : (
            <></>
          )}
        </Grid>
      </Grid>
    </FormControl>
  );
};
