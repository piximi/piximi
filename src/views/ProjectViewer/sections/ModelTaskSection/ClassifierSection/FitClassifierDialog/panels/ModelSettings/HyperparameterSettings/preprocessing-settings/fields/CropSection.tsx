import { useMemo, useState } from "react";

import type { SelectChangeEvent } from "@mui/material";
import { Tooltip, MenuItem, Stack } from "@mui/material";

import { useNumberField } from "hooks";

import { HelpItem } from "components/layout/HelpDrawer/HelpContent";
import { WithLabel, StyledSelect } from "components/inputs";

import { useClassifierStatus } from "@ProjectViewer/contexts/ClassifierStatusProvider";

import { CropSchema } from "utils/dl/enums";
import { enumKeys } from "utils/objectUtils";
import type { CropOptions } from "utils/dl/types";

import { ModelSettingsTextField } from "../../../ModelSettingsTextField";
import { isFieldLocked, lockReason } from "../../settingsLock";

export const CropSection = () => {
  const {
    handleUpdatePreprocessSettings,
    modelIsTrained,
    modelParams,
    classifierStatus,
  } = useClassifierStatus();

  const isTraining = classifierStatus === "training";
  const cropOptions = useMemo(() => {
    return modelParams.preprocessSettings.cropOptions;
  }, [modelParams]);
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
    handleUpdatePreprocessSettings({ cropOptions });
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
  const disabled = isFieldLocked("cropOptions", isTraining, modelIsTrained);
  return (
    <Tooltip
      title={lockReason("cropOptions", isTraining)}
      disableHoverListener={!disabled}
    >
      <Stack direction="row" gap={2}>
        <WithLabel
          data-help={HelpItem.CropOptions}
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
    </Tooltip>
  );
};
