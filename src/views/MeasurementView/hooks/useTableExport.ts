import { useCallback } from "react";
import { useSelector } from "react-redux";
import saveAs from "file-saver";
import { selectMeasurementData } from "store/measurements/selectors";
import {
  selectCategoriesDictionary,
  selectThingsDictionary,
} from "store/data/selectors";

import { MeasurementGroup } from "store/measurements/types";
export const useTableExport = () => {
  const measurementData = useSelector(selectMeasurementData);
  const thingDetails = useSelector(selectThingsDictionary);
  const categories = useSelector(selectCategoriesDictionary);

  const handleExportTable = useCallback(
    (table: MeasurementGroup) => {
      const thingIds = table.thingIds;
      const exportData: Record<string, number | string>[] = [];
      thingIds.forEach((thingId) => {
        const thing = thingDetails[thingId]!;
        const data: Record<string, number | string> = { id: thingId };
        data.name = thing.name;
        data.kind = thing.kind;
        if ("imageId" in thing) {
          data.imageName = thingDetails[thing.imageId]!.name;
          data["bbox [x1:y1:x2:y2]"] = `[${thing.boundingBox.join(":")}]`;
        }
        data.category = categories[thing.categoryId]!.name;
        data.partition = thing.partition;
        Object.assign(data, measurementData[thingId].measurements);
        exportData.push(data);
      });
      const refined: string[] = [];
      refined.push(Object.keys(exportData[0]).join(","));
      exportData.forEach((row) => {
        refined.push(Object.values(row).join(","));
      });
      const csvContent = refined.join("\n");
      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8," });
      const objUrl = URL.createObjectURL(blob);
      saveAs(objUrl, `${table.kind}-measurements.csv`);
    },
    [categories, measurementData, thingDetails],
  );

  return handleExportTable;
};
