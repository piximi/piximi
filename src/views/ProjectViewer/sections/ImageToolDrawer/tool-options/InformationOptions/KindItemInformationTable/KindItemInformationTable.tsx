import { ReactElement, useCallback, useEffect, useState } from "react";
import { useDispatch } from "react-redux";

import { TextFieldWithBlur } from "components/inputs";
import { KindItemCategorySelect } from "./KindItemCategorySelect";
import { KindItemPartitionSelect } from "./KindItemPartitionSelect";

import { Partition } from "utils/models/enums";

import { Kind, GeneralizedKindItem } from "store/data/types";
import { DataTable } from "./DataTable";
import { DataTableRow } from "./DataTableRow";
import { useTheme } from "@mui/material";
import { KindItemKindSelect } from "./KindItemKindSelect";
import { useKindOperations } from "contexts/KindItemsProvider";

export const KindItemInformationTable = ({
  item: item,
  collapsible,
}: {
  item: GeneralizedKindItem;
  collapsible: boolean;
}) => {
  const dispatch = useDispatch();
  const theme = useTheme();
  const [tableData, setTableData] = useState<
    Array<Array<string | number | ReactElement>>
  >([]);
  const [newImageName, setNewImageName] = useState<string>(item.name);

  const { updateKindItem, updateKindItemKind } = useKindOperations();
  const handleImageNameChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      setNewImageName(event.target.value);
    },
    [],
  );

  const handleImageNameBlur = useCallback(() => {
    updateKindItem(item.id, { name: newImageName });
  }, [dispatch, newImageName, item.id]);

  const handleCategorySelect = useCallback(
    (categoryId: string) => {
      updateKindItem(item.id, {
        categoryId: categoryId,
        partition: Partition.Unassigned,
      });
    },
    [dispatch, item],
  );

  const handlePartitionSelect = useCallback(
    (partition: Partition) => {
      updateKindItem(item.id, {
        partition,
      });
    },
    [dispatch, item],
  );

  const handleKindSelect = useCallback(
    (kindId: Kind["id"]) => {
      updateKindItemKind(item.id, kindId);
    },
    [dispatch, item],
  );

  useEffect(() => {
    const data: Array<Array<string | number>> = [];
    const editableData: Array<Array<string | ReactElement>> = [];
    Object.entries(item).forEach((entry) => {
      const [key, value] = entry;

      switch (key) {
        case "name":
          editableData.push([
            "Name",
            <TextFieldWithBlur
              hiddenLabel
              value={item.name}
              onChange={handleImageNameChange}
              onBlur={handleImageNameBlur}
              size="small"
              variant="standard"
              slotProps={{
                htmlInput: {
                  style: {
                    textAlign: "right",
                    fontSize: theme.typography.body2.fontSize,
                  },
                },
              }}
              key={key}
            />,
          ]);
          break;
        case "categoryId":
          editableData.push([
            "Category",
            <KindItemCategorySelect
              currentCategory={item.categoryId}
              callback={handleCategorySelect}
              size="small"
              fullWidth
              variant="standard"
              fontSize="inherit"
              key={key}
            />,
          ]);
          break;
        case "partition":
          editableData.push([
            "Partition",
            <KindItemPartitionSelect
              currentPartition={item.partition}
              callback={handlePartitionSelect}
              size="small"
              variant="standard"
              fontSize="inherit"
              fullWidth
              key={key}
            />,
          ]);
          break;
        case "kind":
          editableData.push([
            "Kind",
            <KindItemKindSelect
              currentKind={item.kind}
              callback={handleKindSelect}
              size="small"
              variant="standard"
              fontSize="inherit"
              fullWidth
              key={key}
            />,
          ]);
          break;
        case "shape":
          Object.entries(value).forEach((shapeEntry) => {
            data.push([shapeEntry[0] as string, shapeEntry[1] as string]);
          });
          break;
        case "timepoint": {
          item.timepoint && data.push(["Timepoint", item.timepoint]);
          break;
        }
        case "activePlane": {
          item.activePlane && data.push(["Timepoint", item.activePlane]);
          break;
        }
        case "plane": {
          item.plane && data.push(["Timepoint", item.plane]);
          break;
        }
        case "colors":
        case "visible":
        case "src":
        case "id":
        case "data":
        case "encodedMask":
        case "decodedMask":
        case "imageId":
        case "boundingBox":
          break;
        default:
          data.push([key as string, value as string]);
      }
    });
    setTableData([...editableData, ...data]);
  }, [
    item,
    handleCategorySelect,
    handleImageNameChange,
    handlePartitionSelect,
  ]);

  return (
    <DataTable title={item.name} collapsible={collapsible}>
      <>
        {tableData.map((row, idx) => {
          return (
            <DataTableRow
              key={`thing-info-table-${item.id}-row-${idx}`}
              rowId={`thing-info-table-${item.id}-row-${idx}`}
              rowData={row}
            />
          );
        })}
      </>
    </DataTable>
  );
};
