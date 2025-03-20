import {
  Box,
  Button,
  Dialog,
  DialogContent,
  FormControl,
  FormControlLabel,
  FormGroup,
  FormHelperText,
  FormLabel,
  List,
  MenuItem,
  Radio,
  RadioGroup,
  Select,
  Tabs,
  Typography,
} from "@mui/material";

import { useFitClassificationModel } from "hooks";

import {
  ModelSummaryTable,
  TwoDataPlot,
} from "views/ProjectViewer/sections/ModelTaskSection/data-display";
import { DialogTransitionSlide } from "components/dialogs";
import { AlertBar } from "components/ui/AlertBar";

import { FitClassifierDialogAppBar } from "./FitClassifierDialogAppBar";
import { ClassifierPreprocessingListItem } from "./ClassifierPreprocessingListItem";
import { ClassifierArchitectureListItem } from "./ClassifierArchitectureListItem";
import { ClassifierOptimizerListItem } from "./ClassifierOptimizerListItem";

import { ModelStatus } from "utils/models/enums";
import { ToolTipTab } from "components/layout";
import { useEffect, useRef, useState } from "react";
import { DividerHeader, FlexRowBox } from "components/ui";
import { ClassifierPreprocessingSettings } from "../training-settings/ClassifierPreprocessingSettings";

type FitClassifierDialogProps = {
  closeDialog: () => void;
  openedDialog: boolean;
};

export const FitClassifierDialog = ({
  closeDialog,
  openedDialog,
}: FitClassifierDialogProps) => {
  const [tabVal, setTabVal] = useState("1");
  const contentRef = useRef<HTMLDivElement>(null);
  const [dialogHeight, setDialogHeight] = useState<number>();
  const {
    showWarning,
    setShowWarning,
    currentEpoch,
    showPlots,
    trainingAccuracy,
    validationAccuracy,
    trainingLoss,
    validationLoss,
    noLabeledThings,
    selectedModel,
    modelStatus,
    alertState,
    fitOptions,
    trainingPercentage,
    noLabeledThingsAlert,
    handleFit,
    hasLabeledInference,
    handleExportHyperparameters,
  } = useFitClassificationModel();

  const onTabSelect = (_event: React.SyntheticEvent, newValue: string) => {
    setTabVal(newValue);
  };

  useEffect(() => {
    if (showPlots) {
      setTabVal("2");
    }
  }, [showPlots]);

  useEffect(() => {
    setDialogHeight(contentRef.current?.clientHeight);
  }, [tabVal]);

  return (
    <>
      <Dialog
        fullWidth
        maxWidth="md"
        onClose={closeDialog}
        onTransitionEnter={() =>
          setDialogHeight(contentRef.current?.clientHeight)
        }
        open={openedDialog}
        slots={{ transition: DialogTransitionSlide }}
        sx={{
          zIndex: 1203,
        }}
      >
        <FitClassifierDialogAppBar
          closeDialog={closeDialog}
          fit={handleFit}
          noLabels={noLabeledThings}
          hasLabeledInference={hasLabeledInference}
          noTrain={!selectedModel.trainable}
          epochs={fitOptions.epochs}
          currentEpoch={currentEpoch}
        />

        {showWarning && noLabeledThings && selectedModel.trainable && (
          <AlertBar
            setShowAlertBar={setShowWarning}
            alertState={noLabeledThingsAlert}
          />
        )}

        {alertState.visible && <AlertBar alertState={alertState} />}
        <Tabs value={tabVal} variant="fullWidth" onChange={onTabSelect}>
          <ToolTipTab label="HyperParameters" value="1" placement="top" />

          <ToolTipTab
            label="Training Plots"
            value="2"
            disabledMessage="No Trained Model"
            placement="top"
            disabled={!showPlots}
          />

          <ToolTipTab
            label="Model Summary"
            value="3"
            disabledMessage="No Trained Model"
            placement="top"
            disabled={
              modelStatus <= ModelStatus.Training || selectedModel.graph
            }
          />
        </Tabs>
        <Box
          sx={(theme) => ({
            height: "60%",
            transition: `height ${theme.transitions.duration.standard}ms ${theme.transitions.easing.easeInOut}`,
          })}
        >
          <DialogContent ref={contentRef}>
            <Box hidden={tabVal !== "1"}>
              <FlexRowBox>
                <FormControl fullWidth>
                  <RadioGroup
                    row
                    defaultValue={0}
                    sx={{ width: "100%", justifyContent: "space-evenly" }}
                  >
                    <FormControlLabel
                      control={<Radio size="small" />}
                      value={0}
                      label={
                        <FormControl
                          size="small"
                          sx={{ flexDirection: "row", alignItems: "center" }}
                        >
                          <FormLabel
                            sx={(theme) => ({
                              fontSize: theme.typography.body2.fontSize,
                              mr: "1rem",
                            })}
                          >
                            New Model:
                          </FormLabel>
                          <FormGroup>
                            <FormHelperText>Model architecture</FormHelperText>
                            <Select
                              MenuProps={{
                                sx: {
                                  py: 0,
                                  "& .MuiList-root-MuiMenu-list": { py: 0 },
                                  "& ul": {
                                    py: 0,
                                  },
                                },
                                slotProps: {
                                  list: {
                                    sx: {
                                      py: 0,
                                      backgroundColor: "red",
                                      display: "none",
                                    },
                                  },
                                  paper: {
                                    sx: {
                                      borderRadius: "0 0 4px 4px",
                                    },
                                  },
                                },
                              }}
                              sx={(theme) => ({
                                fontSize: theme.typography.body2.fontSize,
                                minHeight: "1rem",
                              })}
                              defaultValue={0}
                            >
                              <MenuItem
                                dense
                                value={0}
                                sx={{
                                  borderRadius: 0,
                                  minHeight: "1rem",
                                }}
                              >
                                Simple CNN
                              </MenuItem>
                              <MenuItem
                                dense
                                value={1}
                                sx={{ borderRadius: 0, minHeight: "1rem" }}
                              >
                                MobileNet
                              </MenuItem>
                            </Select>
                          </FormGroup>
                        </FormControl>
                      }
                    />
                    <FormControlLabel
                      control={<Radio size="small" />}
                      value={1}
                      label={
                        <FormControl
                          size="small"
                          sx={{ flexDirection: "row", alignItems: "center" }}
                        >
                          <FormLabel
                            sx={(theme) => ({
                              fontSize: theme.typography.body2.fontSize,
                              mr: "1rem",
                            })}
                          >
                            Pre-Trained Model:
                          </FormLabel>
                          <FormGroup>
                            <FormHelperText>Available Models</FormHelperText>
                            <Select
                              MenuProps={{
                                sx: {
                                  py: 0,
                                  "& .MuiList-root-MuiMenu-list": { py: 0 },
                                  "& ul": {
                                    py: 0,
                                  },
                                },
                                slotProps: {
                                  list: {
                                    sx: {
                                      py: 0,
                                      backgroundColor: "red",
                                      display: "none",
                                    },
                                  },
                                  paper: {
                                    sx: {
                                      borderRadius: "0 0 4px 4px",
                                    },
                                  },
                                },
                              }}
                              sx={(theme) => ({
                                fontSize: theme.typography.body2.fontSize,
                                minHeight: "1rem",
                              })}
                              defaultValue={0}
                            >
                              <MenuItem
                                dense
                                value={0}
                                sx={{
                                  borderRadius: 0,
                                  minHeight: "1rem",
                                }}
                              >
                                Simple CNN
                              </MenuItem>
                              <MenuItem
                                dense
                                value={1}
                                sx={{ borderRadius: 0, minHeight: "1rem" }}
                              >
                                MobileNet
                              </MenuItem>
                            </Select>
                          </FormGroup>
                        </FormControl>
                      }
                    />
                  </RadioGroup>
                </FormControl>
              </FlexRowBox>
              <List dense>
                <DividerHeader typographyVariant="body2" textAlign="left">
                  Data Preprocessing Settings
                </DividerHeader>
                <ClassifierPreprocessingSettings
                  trainingPercentage={trainingPercentage}
                  trainable={selectedModel.trainable}
                />

                <ClassifierOptimizerListItem
                  fitOptions={fitOptions}
                  trainable={selectedModel.trainable}
                />
              </List>
              <Button onClick={handleExportHyperparameters}>
                Export Hyperparameters
              </Button>
            </Box>
            <Box hidden={tabVal !== "2"}>
              <div>
                <TwoDataPlot
                  title="Training History - Accuracy per Epoch"
                  yLabel="Accuracy"
                  xLabel="Epoch"
                  yData1={trainingAccuracy}
                  id1="Accuracy"
                  yData2={validationAccuracy}
                  id2="Validation Accuracy"
                />

                <TwoDataPlot
                  title="Training History - Loss per Epoch"
                  yLabel="Loss"
                  xLabel="Epoch"
                  yData1={trainingLoss}
                  id1="Loss"
                  yData2={validationLoss}
                  id2="Validation Loss"
                  dynamicYRange={true}
                />
              </div>
            </Box>
            <Box hidden={tabVal !== "3"}>
              {/* TODO: implement model summary for graph models */}
              {modelStatus > ModelStatus.Training && !selectedModel.graph && (
                <ModelSummaryTable model={selectedModel} />
              )}
            </Box>
          </DialogContent>
        </Box>
      </Dialog>
    </>
  );
};
