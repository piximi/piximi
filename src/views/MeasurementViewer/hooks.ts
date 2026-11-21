import { useCallback } from "react";

import { useDispatch, useSelector } from "react-redux";

import { saveAs } from "file-saver";

import { useDialogHotkey } from "hooks";

import { HotkeyContext } from "utils/enums";
import { isObjectEmpty } from "utils/objectUtils";

import { selectActiveMeasurementGroup } from "./state/selectors";
import { measurementsSlice } from "./state/measurementsSlice";
import { useMeasurementTable } from "./contexts/MeasurementTableProvider";

/* One entity per line: what identifies it, then the group's selected measurements. */
export const useTableExport = () => {
  const activeGroup = useSelector(selectActiveMeasurementGroup);
  const { scope, rows, columns, table } = useMeasurementTable();

  const handleExportTable = useCallback(() => {
    if (!activeGroup || !scope || !table) return;
    const exportData = rows.map((row) => {
      const data: Record<string, number | string> =
        scope.type === "objects"
          ? {
              id: row.id,
              name: row.name,
              kind: scope.kindId!,
              category: row.categoryName,
              partition: row.partition,
              imageName: row.imageName,
              "bbox [x1:y1:x2:y2]": `[${row.boundingBox?.join(":") ?? ""}]`,
              timepoint: row.timepoint,
            }
          : {
              id: row.id,
              name: row.name,
              category: row.categoryName,
              partition: row.partition,
              timepoint: row.timepoint,
            };
      for (const { label, key } of columns) {
        const value = table.values[key]?.[row.index];
        data[label] = value === null || value === undefined ? "" : value;
      }
      return data;
    });
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
  }, [activeGroup, scope, rows, columns, table]);

  return handleExportTable;
};

export const useCreateMeasurementTable = () => {
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
          }
        : {
            groupType: "objects" as const,
            kindId,
            displayName: name,
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
