import { FormControl, Grid, TextField, Alert } from "@mui/material";
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
import { CustomNumberTextField } from "../../../CustomNumberTextField/CustomNumberTextField";

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

  const dispatchRows = (height: number) => {
    dispatch(
      classifierSlice.actions.updateInputShape({
        inputShape: { ...inputShape, height: height },
      })
    );
  };

  const dispatchCols = (cols: number) => {
    dispatch(
      classifierSlice.actions.updateInputShape({
        inputShape: { ...inputShape, width: cols },
      })
    );
  };

  const dispatchChannels = (channels: number) => {
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
          <CustomNumberTextField
            id="shape-rows"
            label="Input rows"
            value={inputShape.height}
            dispatchCallBack={dispatchRows}
            min={1}
          />
        </Grid>
        <Grid item xs={1}>
          <CustomNumberTextField
            id="shape-cols"
            label="Input cols"
            value={inputShape.width}
            dispatchCallBack={dispatchCols}
            min={1}
          />
        </Grid>
        <Grid item xs={1}>
          <CustomNumberTextField
            id="shape-channels"
            label="Input channels"
            value={inputShape.channels}
            dispatchCallBack={dispatchChannels}
            min={1}
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
