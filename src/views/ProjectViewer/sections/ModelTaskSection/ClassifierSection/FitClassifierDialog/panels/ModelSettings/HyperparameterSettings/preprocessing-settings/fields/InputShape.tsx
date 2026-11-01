import { useMemo } from "react";

import { useSelector } from "react-redux";

import {
  Tooltip,
  FormControl,
  FormLabel,
  Stack,
  Typography,
} from "@mui/material";

import { useNumberField } from "hooks";

import { HelpItem } from "help/HelpContent";
import {
  selectAllChannelMetas,
  selectVisibleChannelCount,
} from "store/data/selectors";

import { useClassificationModel } from "@ProjectViewer/hooks";
import { useClassifierStatus } from "@ProjectViewer/contexts/ClassifierStatusProvider";

import { ModelSettingsTextField } from "../../../ModelSettingsTextField";
import { isFieldLocked, lockReason } from "../../settingsLock";

const RowColInputOptions = { min: 20 };
export const InputShape = () => {
  const modelConfig = useClassificationModel();
  const {
    handleUpdateInputShape,
    modelIsTrained,
    modelParams,
    classifierStatus,
  } = useClassifierStatus();
  const totalChannels = useSelector(selectAllChannelMetas).length;
  const visibleChannels = useSelector(selectVisibleChannelCount);
  const hasHiddenChannels = visibleChannels < totalChannels;

  const isTraining = classifierStatus === "training";

  const inputShape = useMemo(() => {
    return modelParams.preprocessSettings.inputShape;
  }, [modelParams]);

  const {
    inputValue: inputCols,
    inputString: inputColsDisplay,
    setLastValidInput: setLastValidInputCols,
    resetInputValue: resetInputcols,
    handleOnChangeValidation: handleInputColsChange,
    error: inputColsError,
  } = useNumberField(inputShape.width, RowColInputOptions);
  const {
    inputValue: inputRows,
    inputString: inputRowsDisplay,
    setLastValidInput: setLastValidInputRows,
    resetInputValue: resetInputRows,
    handleOnChangeValidation: handleInputRowsChange,
    error: inputRowsError,
  } = useNumberField(inputShape.height, RowColInputOptions);
  const {
    inputValue: inputChannels,
    inputString: inputChannelsDisplay,
    setLastValidInput: setLastValidInputChannels,
    resetInputValue: resetInputChannels,
    handleOnChangeValidation: handleInputChannelsChange,
    error: inputChannelsError,
  } = useNumberField(inputShape.channels);

  const fixedChannels = useMemo(
    () => modelConfig && !!modelConfig.requiredChannels,
    [modelConfig],
  );

  const disabled = isFieldLocked("inputShape", isTraining, modelIsTrained);
  const handleBlurDispatch = (
    event: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement, Element>,
  ) => {
    const inputID = event.target.id;
    switch (inputID) {
      case "shape-rows":
        if (inputRowsError.error) {
          resetInputRows();
          return;
        }
        if (inputRows === inputShape.height) return;
        setLastValidInputRows(inputRows);
        handleUpdateInputShape({ height: inputRows });

        return;
      case "shape-cols":
        if (inputColsError.error) {
          resetInputcols();
          return;
        }
        if (inputCols === inputShape.width) return;
        setLastValidInputCols(inputCols);
        handleUpdateInputShape({ width: inputCols });

        return;
      case "shape-channels":
        if (inputChannelsError.error) {
          resetInputChannels();
          return;
        }
        if (inputChannels === inputShape.channels) return;
        setLastValidInputChannels(inputChannels);
        handleUpdateInputShape({ channels: inputChannels });
    }
  };

  return (
    <Stack>
      <Tooltip
        title={lockReason("inputShape", isTraining)}
        disableHoverListener={!disabled}
      >
        <FormControl
          size="small"
          sx={{ flexDirection: "row", alignItems: "center", pt: 1 }}
          fullWidth
        >
          <FormLabel
            data-help={HelpItem.InputShape}
            sx={(theme) => ({
              fontSize: theme.typography.body2.fontSize,
              mr: "1rem",
              whiteSpace: "nowrap",
            })}
          >
            Input Shape:
          </FormLabel>
          <Stack direction="row" gap={2}>
            <ModelSettingsTextField
              id="shape-cols"
              size="small"
              label="Col"
              onChange={handleInputColsChange}
              value={inputColsDisplay}
              onBlur={handleBlurDispatch}
              disabled={disabled}
            />
            <ModelSettingsTextField
              id="shape-rows"
              size="small"
              label="Row"
              onChange={handleInputRowsChange}
              value={inputRowsDisplay}
              onBlur={handleBlurDispatch}
              disabled={disabled}
            />
            <ModelSettingsTextField
              id="shape-channels"
              size="small"
              label="Ch."
              onChange={handleInputChannelsChange}
              value={inputChannelsDisplay}
              onBlur={handleBlurDispatch}
              disabled={disabled || fixedChannels}
            />
          </Stack>
        </FormControl>
      </Tooltip>
      {hasHiddenChannels && (
        <Typography
          variant="caption"
          sx={{
            mt: 1,
            color: "var(--mui-palette-warning-main)",
            whiteSpace: "nowrap",
            alignSelf: "center",
          }}
        >
          Training on visible channels only
        </Typography>
      )}
    </Stack>
  );
};
