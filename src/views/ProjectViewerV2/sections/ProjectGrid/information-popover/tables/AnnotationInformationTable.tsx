import type { ReactElement } from "react";
import { useCallback, useEffect, useMemo, useState } from "react";

import { batch, useDispatch, useSelector } from "react-redux";

import type { SelectChangeEvent } from "@mui/material";
import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  FormControl,
  FormControlLabel,
  MenuItem,
  Radio,
  RadioGroup,
  Typography,
} from "@mui/material";

import { useDialog } from "hooks";

import { StyledSelect } from "components/inputs";

import { dataSliceV2 } from "store/dataV2";
import type { Kind, ExtendedAnnotationObject } from "store/dataV2/types";
import { useParameterizedSelector } from "store/hooks";
import {
  selectCategoriesByKindId,
  selectExtendedAnnotationById,
  selectKindEntities,
} from "store/dataV2/selectors";
import { generateCategory } from "store/dataV2/utils";

import type { Partition } from "utils/modelsV2/enums";

import {
  AnnotationKindSelect,
  ItemCategorySelect,
  ItemPartitionSelect,
  SimpleLabel,
} from "./cells";
import { ItemInformationTable } from "./ItemInformationTable";
import { useInformationPopover } from "../InformationPopoverProvider";

export const AnnotationPopoverContent = ({
  itemId,
  onMissing,
}: {
  itemId: string;
  onMissing: () => void;
}) => {
  const annotation = useParameterizedSelector(
    selectExtendedAnnotationById,
    itemId,
  );
  useEffect(() => {
    if (!annotation) onMissing();
  }, [annotation, onMissing]);
  if (!annotation) return null;
  return <AnnotationInfoTable annotation={annotation} />;
};

export const AnnotationInfoTable = ({
  annotation,
}: {
  annotation: ExtendedAnnotationObject;
}) => {
  const dispatch = useDispatch();
  const kinds = useSelector(selectKindEntities);

  const [targetKindId, setTargetKindId] = useState<string>();
  const {
    open: kindDialogOpen,
    onOpen: handleKindDialogOpen,
    onClose: handleKindDialogClose,
  } = useDialog();

  const handleCancelKindChange = () => {
    setTargetKindId(undefined);
    handleKindDialogClose();
  };
  const handleCategorySelect = useCallback(
    (categoryId: string) => {
      dispatch(
        dataSliceV2.actions.bubbleUpdateAnnotationCategory({
          id: annotation.id,
          categoryId: categoryId,
        }),
      );
    },
    [dispatch, annotation],
  );

  const handlePartitionSelect = useCallback(
    (partition: Partition) => {
      dispatch(
        dataSliceV2.actions.updateAnnotationPartition({
          id: annotation.id,
          partition,
        }),
      );
    },
    [dispatch, annotation],
  );

  const handleKindSelect = useCallback(
    (kindId: string) => {
      setTargetKindId(kindId);
      handleKindDialogOpen();
    },
    [dispatch, handleKindDialogOpen],
  );

  const tableData = useMemo(() => {
    const data: Array<Array<string | number | ReactElement>> = [];
    data.push([
      "Image Name",
      <SimpleLabel value={annotation.imageName} key="image-name" />,
    ]);
    data.push([
      "Plane",
      <SimpleLabel value={annotation.planeIdx} key="plane-index" />,
    ]);
    data.push([
      "Category",
      <ItemCategorySelect
        currentCategory={annotation.categoryId}
        callback={handleCategorySelect}
        key={"categoryId"}
      />,
    ]);
    data.push([
      "Partition",
      <ItemPartitionSelect
        currentPartition={annotation.partition}
        callback={handlePartitionSelect}
        key={"partition"}
      />,
    ]);
    data.push([
      "Kind",
      <AnnotationKindSelect
        currentId={annotation.kindId}
        callback={handleKindSelect}
        key={"kindId"}
      />,
    ]);

    Object.entries(annotation.shape).forEach((shapeEntry) => {
      data.push([shapeEntry[0] as string, shapeEntry[1] + ""]);
    });

    return data;
  }, [
    annotation,
    handleCategorySelect,
    handlePartitionSelect,
    handleKindSelect,
  ]);

  return (
    <>
      <ItemInformationTable
        title={"Annotation-" + annotation.id.slice(0, 5)}
        data={tableData}
      />
      {targetKindId && (
        <KindChangeDialog
          open={kindDialogOpen}
          onClose={handleCancelKindChange}
          previousKindName={kinds[annotation.kindId].name}
          targetKind={kinds[targetKindId]}
          targetAnn={annotation}
        />
      )}
    </>
  );
};

/* 
  ? Decision:
  ?- leave default behavior of closing info popover when changing kind
  ?- switch to new kind tab, scroll to item, display popover in correct place
  */
type KindChangeDecision = "copy" | "map";
const KindChangeDialog = ({
  open,
  onClose,
  previousKindName,
  targetKind,
  targetAnn,
}: {
  open: boolean;
  onClose: () => void;
  previousKindName: string;
  targetKind: Kind;
  targetAnn: ExtendedAnnotationObject;
}) => {
  const dispatch = useDispatch();
  const categoryChangeOptions = useParameterizedSelector(
    selectCategoriesByKindId,
    targetKind.id,
  );
  const [selectedCategoryId, setSelectedCategoryId] = useState(
    targetKind.unknownCategoryId,
  );

  const { close: closePopover } = useInformationPopover();

  const hasMatchedCategory = categoryChangeOptions
    .map((c) => c.name)
    .includes(targetAnn.category.name);
  const [decision, setDecision] = useState<KindChangeDecision>(
    hasMatchedCategory ? "map" : "copy",
  );

  const handleChooseExistingCategory = (event: SelectChangeEvent<unknown>) => {
    setSelectedCategoryId(event.target.value as string);
  };

  const handleDecision = (
    _e: React.ChangeEvent<HTMLInputElement>,
    decision: string,
  ) => {
    setDecision(decision as KindChangeDecision);
  };

  const dispatchAnnotationKindChange = useMemo(() => {
    switch (decision) {
      case "copy":
        const copiedCategory = generateCategory(
          targetAnn.category.name,
          targetAnn.category.color,
          { type: "annotation", kindId: targetKind.id },
        );
        return () =>
          batch(() => {
            dispatch(dataSliceV2.actions.addCategory(copiedCategory));
            dispatch(
              dataSliceV2.actions.bubbleUpdateAnnotationKind({
                id: targetAnn.id,
                kindId: targetKind.id,
                categoryId: copiedCategory.id,
              }),
            );
          });

      case "map":
        return () => {
          dispatch(
            dataSliceV2.actions.bubbleUpdateAnnotationKind({
              id: targetAnn.id,
              kindId: targetKind.id,
              categoryId: selectedCategoryId,
            }),
          );
        };
    }
  }, [decision, selectedCategoryId]);

  const handleConfirm = () => {
    onClose();
    dispatchAnnotationKindChange();
    closePopover();
  };

  return (
    <Dialog open={open} onClose={onClose} keepMounted={false}>
      <DialogTitle>
        <Typography>{`Kind Change: ${previousKindName} -> ${targetKind.name}`}</Typography>
      </DialogTitle>
      <DialogContent
        sx={{ position: "relative", display: "flex", flexDirection: "column" }}
      >
        <Box sx={{ display: "flex", flexDirection: "column" }}>
          <Typography>
            How would you like to categorize the annotation?
          </Typography>
          <Divider sx={{ my: 2 }} />
          <FormControl size="small">
            <RadioGroup
              aria-labelledby="kind-change-radio-buttons-group"
              name="kind-change-radio-buttons-group"
              value={decision}
              onChange={handleDecision}
            >
              <FormControlLabel
                value="copy"
                control={<Radio size="small" />}
                label={`Duplicate the current "${targetAnn.category.name}" category`}
                disabled={hasMatchedCategory}
                sx={{ display: "flex", alignItems: "center" }}
              />
              <FormControlLabel
                value="map"
                control={<Radio size="small" />}
                label={
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                    <Typography sx={{ textAlign: "center" }}>
                      {`Choose as existing category`}:
                    </Typography>
                    <StyledSelect
                      value={selectedCategoryId}
                      onChange={(event) => handleChooseExistingCategory(event)}
                      size="small"
                      variant="standard"
                      fontSize="inherit"
                    >
                      {categoryChangeOptions.map((category) => (
                        <MenuItem
                          key={`kinf-cat-select-${category.id}`}
                          value={category.id}
                          dense
                        >
                          {category.name}
                        </MenuItem>
                      ))}
                    </StyledSelect>
                  </Box>
                }
                sx={{ display: "flex", alignItems: "center" }}
              />
            </RadioGroup>
          </FormControl>
        </Box>
      </DialogContent>
      <DialogActions>
        <Button variant="text" onClick={onClose}>
          Cancel
        </Button>
        <Button variant="text" onClick={handleConfirm}>
          Confirm
        </Button>
      </DialogActions>
    </Dialog>
  );
};
