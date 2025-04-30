import { ExpandLess, ExpandMore } from "@mui/icons-material";
import {
  Checkbox,
  Collapse,
  FormControl,
  FormControlLabel,
  FormLabel,
  Grid2 as Grid,
  IconButton,
  MenuItem,
  SelectChangeEvent,
  Stack,
} from "@mui/material";
import { FunctionalDivider } from "components/ui";
import { useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { classifierSlice } from "store/classifier";
import {
  selectClassifierCropOptions,
  selectClassifierInputShape,
  selectClassifierModel,
  selectClassifierModelWithIdx,
  selectClassifierRescaleOptions,
} from "store/classifier/reselectors";
import { selectActiveKindId } from "store/project/selectors";
import { enumKeys } from "utils/common/helpers";
import { CropSchema } from "utils/models/enums";
import { CropOptions, RescaleOptions } from "utils/models/types";
import { ModelSettingsTextField } from "views/ProjectViewer/components/ModelSettingsTextField";
import { StyledSelect } from "views/ProjectViewer/components/StyledSelect";
import { WithLabel } from "views/ProjectViewer/components/WithLabel";
import { useNumberField } from "views/ProjectViewer/hooks/useNumberField";

const RowColInputOptions = { min: 20 };
const InputShapeField = ({ disabled }: { disabled: boolean }) => {
  const dispatch = useDispatch();
  const inputShape = useSelector(selectClassifierInputShape);
  const activeKindId = useSelector(selectActiveKindId);
  const selectedModel = useSelector(selectClassifierModelWithIdx);

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
    () => selectedModel && !!selectedModel.model?.requiredChannels,
    [selectedModel],
  );

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
        dispatch(
          classifierSlice.actions.updateInputShape({
            inputShape: { ...inputShape, height: inputRows },
            kindId: activeKindId,
          }),
        );
        return;
      case "shape-cols":
        if (inputColsError.error) {
          resetInputcols();
          return;
        }
        if (inputCols === inputShape.width) return;
        setLastValidInputCols(inputCols);
        dispatch(
          classifierSlice.actions.updateInputShape({
            inputShape: { ...inputShape, width: inputCols },
            kindId: activeKindId,
          }),
        );
        return;
      case "shape-channels":
        if (inputChannelsError.error) {
          resetInputChannels();
          return;
        }
        if (inputChannels === inputShape.channels) return;
        setLastValidInputChannels(inputChannels);
        dispatch(
          classifierSlice.actions.updateInputShape({
            inputShape: { ...inputShape, channels: inputChannels },
            kindId: activeKindId,
          }),
        );
    }
  };

  return (
    <FormControl
      size="small"
      sx={{ flexDirection: "row", alignItems: "center", pt: 1 }}
      fullWidth
    >
      <FormLabel
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
  );
};

const CropSection = ({ disabled }: { disabled: boolean }) => {
  const dispatch = useDispatch();
  const cropOptions = useSelector(selectClassifierCropOptions);
  const activeKindId = useSelector(selectActiveKindId);
  const [cropDisabled, setCropDisabled] = useState<boolean>(
    cropOptions.cropSchema === CropSchema.None,
  );
  const {
    inputValue: numCrops,
    inputString: numCropsDisplay,
    resetInputValue: resetNumCrops,
    setLastValidInput: setLastValidCrops,
    handleOnChangeValidation: handleNumCropsChange,
    error: cropsInputError,
  } = useNumberField(cropOptions.numCrops);
  const updateCropOptions = (cropOptions: CropOptions) => {
    dispatch(
      classifierSlice.actions.updateModelPreprocessOptions({
        settings: { cropOptions },
        kindId: activeKindId,
      }),
    );
  };
  const dispatchNumCrops = () => {
    if (cropsInputError.error) {
      resetNumCrops();
      return;
    }
    if (numCrops === cropOptions.numCrops) return;
    setLastValidCrops(numCrops);
    updateCropOptions({ ...cropOptions, numCrops });
  };
  const onCropSchemaChange = (event: SelectChangeEvent<unknown>) => {
    const cropSchema = event.target.value as CropSchema;

    if (cropSchema === CropSchema.None) {
      setCropDisabled(true);
      updateCropOptions({ numCrops: 1, cropSchema });
    } else {
      setCropDisabled(false);
      updateCropOptions({ ...cropOptions, cropSchema });
    }
  };
  return (
    <Stack direction="row" gap={2}>
      <WithLabel
        label="Crop Type:"
        labelProps={{
          variant: "body2",
          sx: { mr: "1rem", whiteSpace: "nowrap" },
        }}
      >
        <StyledSelect
          value={cropOptions.cropSchema}
          onChange={onCropSchemaChange}
          disabled={disabled}
          displayEmpty
          inputProps={{ "aria-label": "Without label" }}
        >
          {enumKeys(CropSchema).map((k) => {
            return (
              <MenuItem key={k} value={CropSchema[k]} dense>
                {CropSchema[k]}
              </MenuItem>
            );
          })}
        </StyledSelect>
      </WithLabel>

      <WithLabel
        label="# of Crops:"
        labelProps={{
          variant: "body2",
          sx: { mr: "1rem", whiteSpace: "nowrap" },
        }}
      >
        <ModelSettingsTextField
          size="small"
          onChange={handleNumCropsChange}
          value={numCropsDisplay}
          onBlur={dispatchNumCrops}
          disabled={cropDisabled || disabled}
        />
      </WithLabel>
    </Stack>
  );
};
export const ImageAugmentationSettings = () => {
  const dispatch = useDispatch();
  const activeKindId = useSelector(selectActiveKindId);
  const rescaleOptions = useSelector(selectClassifierRescaleOptions);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [rescalable, setRescalable] = useState<boolean>(rescaleOptions.rescale);
  const selectedModel = useSelector(selectClassifierModel);

  const updateRescaleOptions = (rescaleOptions: RescaleOptions) => {
    dispatch(
      classifierSlice.actions.updateModelPreprocessOptions({
        settings: { rescaleOptions },
        kindId: activeKindId,
      }),
    );
  };

  const onCheckboxChange = () => {
    setRescalable(!rescalable);
    updateRescaleOptions({
      ...rescaleOptions,
      rescale: !rescaleOptions.rescale,
    });
  };

  return (
    <Grid size={12}>
      <FunctionalDivider
        headerText="Image Augmentation"
        typographyVariant="body2"
        actions={
          <IconButton
            size="small"
            onClick={() => setShowAdvanced((showAdvanced) => !showAdvanced)}
          >
            {showAdvanced ? <ExpandLess /> : <ExpandMore />}
          </IconButton>
        }
      />

      <Stack sx={{ pl: 2 }} spacing={4}>
        <InputShapeField disabled={!!selectedModel} />
        <Collapse in={showAdvanced} style={{ marginTop: 0 }}>
          <Stack spacing={4} sx={{ mt: 4 }}>
            <CropSection disabled={!rescalable || !!selectedModel} />
            <FormControl size="small">
              <FormControlLabel
                sx={(theme) => ({
                  fontSize: theme.typography.body2.fontSize,
                  width: "max-content",
                  ml: 0,
                })}
                control={
                  <Checkbox
                    checked={rescalable}
                    onChange={onCheckboxChange}
                    name="rescale"
                    color="primary"
                    size="small"
                  />
                }
                label="Rescale pixel intensities:"
                labelPlacement="start"
                disableTypography
                disabled={!!selectedModel}
              />
            </FormControl>
          </Stack>
        </Collapse>
      </Stack>
    </Grid>
  );
};
