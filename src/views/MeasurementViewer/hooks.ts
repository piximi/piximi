import { useCallback } from "react";

import { useDispatch, useSelector } from "react-redux";

import { saveAs } from "file-saver";

import { useDialogHotkey } from "hooks";

import { HotkeyContext } from "utils/enums";
import { isObjectEmpty } from "utils/objectUtils";
import { formatString } from "utils/stringUtils";

import { selectActiveMeasurementGroup } from "./state/selectors";
import { measurementsSlice } from "./state/measurementsSlice";
import { selectActiveMeasuredEntities } from "./state/reselectors";
import {
  selectAllExtendedAnnotations,
  selectAllImages,
  selectCategoryEntities,
  selectExtendedImageEntities,
} from "store/dataV2/selectors";
import {
  CHANNEL_MEASUREMENTS,
  ExtendedAnnotationObject,
  ExtendedImageObject,
} from "store/dataV2/types";

const buildAnnotationMeasurementData = (
  entity: ExtendedAnnotationObject,
  idx: number,
): Record<string, number | string> => {
  const data: Record<string, number | string> = {
    id: entity.id,
    name: entity.imageName + "_" + idx,
    kind: entity.kindId,
    category: entity.category.name,
    partition: entity.partition,
    imageName: entity.imageName,
    "bbox [x1:y1:x2:y2]": `[${entity.boundingBox.join(":")}]`,
    timepoint: entity.timepoint === undefined ? "N/A" : entity.timepoint,
  };
  if (entity.features) Object.assign(data, entity.features);
  return data;
};
const buildImageMeasurementData = (
  entity: ExtendedImageObject,
): Record<string, number | string> => {
  const data: Record<string, number | string> = {
    id: entity.id,
    name: entity.name,
    category: entity.category.name,
    partition: entity.partition,
    timepoint: entity.timepoint === undefined ? "N/A" : entity.timepoint,
  };
  entity.channelsRef.forEach((c) => {
    const labelSuffix = `-Intensity-Channel_${c.name}`;
    CHANNEL_MEASUREMENTS.forEach((m) => {
      const val = c[m];
      if (!val) return;
      data[formatString(m, undefined, "every-word") + labelSuffix] = val;
    });
  });
  return data;
};
export const useTableExport = () => {
  const activeGroup = useSelector(selectActiveMeasurementGroup);
  const activeMeasuredEntities = useSelector(selectActiveMeasuredEntities);
  const images = useSelector(selectExtendedImageEntities);
  const categories = useSelector(selectCategoryEntities);

  const handleExportTable = useCallback(() => {
    if (!activeGroup) return;
    const exportData: Record<string, number | string>[] = [];
    Object.values(activeMeasuredEntities).forEach(
      (entity: ExtendedImageObject | ExtendedAnnotationObject, idx) => {
        const data =
          "kindId" in entity
            ? buildAnnotationMeasurementData(entity, idx)
            : buildImageMeasurementData(entity);

        exportData.push(data);
      },
    );
    if (isObjectEmpty(exportData)) return;
    const refined: string[] = [];
    refined.push(Object.keys(exportData[0]).join(","));
    exportData.forEach((row) => {
      refined.push(Object.values(row).join(","));
    });
    const csvContent = refined.join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8," });
    const objUrl = URL.createObjectURL(blob);
    saveAs(objUrl, `${activeGroup.name.replaceAll(" ", "-")}.csv`);
    URL.revokeObjectURL(objUrl);
  }, [activeGroup, activeMeasuredEntities, categories, images]);

  return handleExportTable;
};

export const useCreateMeasurementTable = () => {
  const images = useSelector(selectAllImages);
  const annotations = useSelector(selectAllExtendedAnnotations);
  const dispatch = useDispatch();

  const {
    onClose: handleCloseTableDialog,
    onOpen: handleOpenTableDialog,
    open: isTableDialogOpen,
  } = useDialogHotkey(HotkeyContext.ConfirmationDialog);

  const handleCreateTable = async (kindId: string, name: string) => {
    const groupParams =
      kindId === "image"
        ? {
            groupType: "images" as const,
            displayName: "Images",
            itemIds: images.map((i) => i.id),
          }
        : {
            groupType: "objects" as const,
            kindId,
            displayName: name,
            itemIds: annotations
              .filter((a) => a.kindId === kindId)
              .map((a) => a.id),
          };
    dispatch(measurementsSlice.actions.createGroup(groupParams));
  };

  return {
    handleOpenTableDialog,
    handleCloseTableDialog,
    isTableDialogOpen,
    handleCreateTable,
  };
};
