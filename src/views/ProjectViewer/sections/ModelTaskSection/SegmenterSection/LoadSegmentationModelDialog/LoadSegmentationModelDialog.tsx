import type React from "react";
import { useCallback, useEffect, useState } from "react";

import { useSelector } from "react-redux";

import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Tabs,
} from "@mui/material";

import { useHotkeys } from "hooks";

import { ToolTipTab } from "components/layout";

import { selectProjectImageChannels } from "@ProjectViewer/state/selectors";
import type { Shape } from "store/dataV2/types";

import { useSegmenterApi } from "utils/dl/segmentation";
import { HotkeyContext } from "utils/enums";
import type { SegmentaionModelDetails } from "utils/dl/segmentation/types";

import { PretrainedModelSelector } from "./PretrainedModelSelector";

type LoadSegmentationModelDialogProps = {
  onClose: () => void;
  loadedModel?: SegmentaionModelDetails;
  open: boolean;
  dispatchFunction: (
    model: SegmentaionModelDetails,
    inputShape: Shape,
  ) => Promise<void>;
};

export const LoadSegmentationModelDialog = ({
  onClose,
  loadedModel,
  open,
  dispatchFunction,
}: LoadSegmentationModelDialogProps) => {
  const projectChannels = useSelector(selectProjectImageChannels);
  const [selectedModel, setSelectedModel] = useState<
    SegmentaionModelDetails | undefined
  >(
    loadedModel?.name === "Fully Convolutional Network"
      ? undefined
      : loadedModel,
  );
  const [inputShape, _setInputShape] = useState<Shape>({
    height: 256,
    width: 256,
    channels: 3,
    planes: 1,
  });

  const [pretrainedModels, setPretrainedModels] = useState<
    Array<SegmentaionModelDetails>
  >([]);

  const [tabVal, setTabVal] = useState("1");
  const [invalidModel, setInvalidModel] = useState(false);
  const segApi = useSegmenterApi();

  const onModelChange = useCallback(
    (model: SegmentaionModelDetails | undefined) => {
      setSelectedModel(model);
    },
    [],
  );

  const dispatchModelToStore = async () => {
    if (!selectedModel) {
      import.meta.env.NODE_ENV !== "production" &&
        console.warn("Attempting to dispatch undefined model");
      return;
    }

    await dispatchFunction(selectedModel, inputShape);

    setInvalidModel(false);
    onClose();
  };

  const closeDialog = () => {
    setInvalidModel(false);
    setSelectedModel(loadedModel);
    onClose();
  };

  const onTabSelect = (event: React.SyntheticEvent, newValue: string) => {
    setTabVal(newValue);
  };

  useHotkeys(
    "enter",
    () => {
      selectedModel && !invalidModel && dispatchModelToStore();
    },
    HotkeyContext.ConfirmationDialog,

    [dispatchModelToStore, selectedModel, invalidModel],
  );

  useEffect(() => {
    (async () => {
      const results = await segApi.getAvailableSegmentationModels();
      if (results.success) {
        const modelDetails = Object.values(results.data);
        setPretrainedModels(modelDetails);

        // if no pretrained models, make sure not on tab 1
        setTabVal((curr) =>
          modelDetails.length === 0 && curr === "1" ? "2" : curr,
        );
      }
    })();
  }, []);

  useEffect(() => {
    if (
      selectedModel &&
      selectedModel.requiredChannels !== undefined &&
      projectChannels !== undefined &&
      selectedModel.requiredChannels !== projectChannels
    ) {
      setInvalidModel(true);
    } else {
      setInvalidModel(false);
    }
  }, [projectChannels, selectedModel]);

  return (
    <Dialog fullWidth maxWidth="sm" onClose={closeDialog} open={open}>
      <DialogTitle>Load Segmentation model</DialogTitle>

      <Tabs value={tabVal} variant="fullWidth" onChange={onTabSelect}>
        <ToolTipTab label="Load Pretrained" value="1" placement="top" />
      </Tabs>
      <DialogContent>
        <Box
          sx={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
          }}
          hidden={tabVal !== "1"}
        >
          <PretrainedModelSelector
            values={pretrainedModels}
            initModel={
              selectedModel
                ? pretrainedModels.findIndex(
                    (model) => model.name === selectedModel.name,
                  ) + ""
                : "-1"
            }
            setModel={onModelChange}
            error={invalidModel}
            errorText={
              !selectedModel
                ? "Select a Model"
                : invalidModel
                  ? `Model requires ${selectedModel.requiredChannels}-channel images`
                  : ""
            }
          />
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={closeDialog} color="primary">
          Cancel
        </Button>

        <Button
          onClick={dispatchModelToStore}
          color="primary"
          disabled={!selectedModel || invalidModel}
        >
          Open Segmentation model
        </Button>
      </DialogActions>
    </Dialog>
  );
};
