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
import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { classifierSlice } from "store/classifier";
import {
  selectClassifierCropOptions,
  selectClassifierInputShape,
  selectClassifierModelWithIdx,
  selectClassifierRescaleOptions,
} from "store/classifier/reselectors";
import { selectActiveKindId } from "store/project/selectors";
import { enumKeys } from "utils/common/helpers";
import { CropSchema } from "utils/models/enums";
import { CropOptions, RescaleOptions } from "utils/models/types";
import { StyledSelect } from "views/ProjectViewer/components/StyledSelect";
import { TextFieldWithBlur } from "views/ProjectViewer/components/TextFieldWithBlur";
import { WithLabel } from "views/ProjectViewer/components/WithLabel";
import { useNumberField } from "views/ProjectViewer/hooks/useNumberField";

const InputShapeField = () => {
  const dispatch = useDispatch();
  const inputShape = useSelector(selectClassifierInputShape);
  const activeKindId = useSelector(selectActiveKindId);
  const selectedModel = useSelector(selectClassifierModelWithIdx);

  const {
    inputValue: colsInput,
    resetInputValue: resetColsInput,
    handleOnChangeValidation: handleColsInputChange,
    error: colsInputError,
  } = useNumberField(inputShape.width);
  const {
    inputValue: rowsInput,
    resetInputValue: resetRowsInput,
    handleOnChangeValidation: handleRowsInputChange,
    error: rowsInputError,
  } = useNumberField(inputShape.height);
  const {
    inputValue: channelsInput,
    resetInputValue: resetChannelsInput,
    handleOnChangeValidation: handleChannelsInputChange,
    error: channelsInputError,
  } = useNumberField(inputShape.channels);

  const [fixedNumberOfChannels, setFixedNumberOfChannels] =
    useState<boolean>(false);
  const [fixedNumberOfChannelsHelperText, setFixedNumberOfChannelsHelperText] =
    useState<string>("");

  const handleBlurDispatch = (
    event: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement, Element>,
  ) => {
    const inputID = event.target.id;
    switch (inputID) {
      case "shape-rows":
        if (rowsInputError.error) {
          resetRowsInput();
          return;
        }
        dispatch(
          classifierSlice.actions.updateInputShape({
            inputShape: { ...inputShape, height: rowsInput },
            kindId: activeKindId,
          }),
        );
        return;
      case "shape-cols":
        if (colsInputError.error) {
          resetColsInput();
          return;
        }
        dispatch(
          classifierSlice.actions.updateInputShape({
            inputShape: { ...inputShape, width: colsInput },
            kindId: activeKindId,
          }),
        );
        return;
      case "shape-channels":
        if (channelsInputError.error) {
          resetChannelsInput();
          return;
        }
        dispatch(
          classifierSlice.actions.updateInputShape({
            inputShape: { ...inputShape, channels: channelsInput },
            kindId: activeKindId,
          }),
        );
    }
  };

  useEffect(() => {
    if (selectedModel.model && selectedModel.model.requiredChannels) {
      setFixedNumberOfChannels(true);
      setFixedNumberOfChannelsHelperText(
        `${selectedModel.model.name} requires ${selectedModel.model.requiredChannels} channels!`,
      );
    } else {
      setFixedNumberOfChannels(false);
      setFixedNumberOfChannelsHelperText("");
    }
  }, [selectedModel]);
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
        <TextFieldWithBlur
          id="shape-cols"
          size="small"
          label="Col"
          onChange={handleColsInputChange}
          value={colsInput}
          onBlur={handleBlurDispatch}
          disabled={selectedModel.model && !selectedModel.model.trainable}
          slotProps={{
            inputLabel: { sx: { top: "-2px" } },
          }}
          sx={(theme) => ({
            width: "7ch",
            input: {
              py: 0.5,
              fontSize: theme.typography.body2.fontSize,
              minHeight: "1rem",
            },
          })}
        />
        <TextFieldWithBlur
          id="shape-rows"
          size="small"
          label="Row"
          onChange={handleRowsInputChange}
          value={rowsInput}
          onBlur={handleBlurDispatch}
          disabled={selectedModel.model && !selectedModel.model.trainable}
          slotProps={{
            inputLabel: { sx: { top: "-2px" } },
          }}
          sx={(theme) => ({
            width: "7ch",
            input: {
              py: 0.5,
              fontSize: theme.typography.body2.fontSize,
              minHeight: "1rem",
            },
          })}
        />
        <TextFieldWithBlur
          id="shape-channels"
          size="small"
          label="Ch."
          onChange={handleChannelsInputChange}
          value={channelsInput}
          onBlur={handleBlurDispatch}
          disabled={selectedModel.model && !selectedModel.model.trainable}
          slotProps={{
            inputLabel: { sx: { top: "-2px" } },
          }}
          sx={(theme) => ({
            width: "7ch",
            input: {
              py: 0.5,
              fontSize: theme.typography.body2.fontSize,
              minHeight: "1rem",
            },
          })}
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
        <TextFieldWithBlur
          size="small"
          onChange={handleNumCropsChange}
          value={numCrops}
          onBlur={dispatchNumCrops}
          sx={(theme) => ({
            width: "6ch",
            input: {
              py: 0.5,
              fontSize: theme.typography.body2.fontSize,
              minHeight: "1rem",
            },
          })}
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
        <InputShapeField />
        <Collapse in={showAdvanced} style={{ marginTop: 0 }}>
          <Stack spacing={4} sx={{ mt: 4 }}>
            <CropSection disabled={!rescalable} />
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
              />
            </FormControl>
          </Stack>
        </Collapse>
      </Stack>
    </Grid>
  );
};
