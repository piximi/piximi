import { ReactElement, useCallback, useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";

import { TextFieldWithBlur } from "components/inputs";
import { ThingCategorySelect } from "./ThingCategorySelect";
import { ImagePartitionSelect } from "./ImagePartitionSelect";

import { dataSlice } from "store/data/dataSlice";

import { Partition } from "utils/models/enums";

import { Thing } from "store/data/types";
import { DataTable } from "./DataTable";
import { DataTableRow } from "./DataTableRow";
import { selectRenderKindName } from "store/data/selectors";
import { useTheme } from "@mui/material";

export const ThingInformationTable = ({
  thing,
  collapsible,
}: {
  thing: Thing;
  collapsible: boolean;
}) => {
  const dispatch = useDispatch();
  const theme = useTheme();
  const [tableData, setTableData] = useState<
    Array<Array<string | number | ReactElement>>
  >([]);
  const renderedKindName = useSelector(selectRenderKindName);
  const [newImageName, setNewImageName] = useState<string>(thing.name);

  const handleImageNameChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      setNewImageName(event.target.value);
    },
    [],
  );

  const handleImageNameBlur = useCallback(() => {
    dispatch(
      dataSlice.actions.updateThingName({
        id: thing.id,
        name: newImageName,
      }),
    );
  }, [dispatch, newImageName, thing.id]);

  const handleCategorySelect = useCallback(
    (categoryId: string) => {
      dispatch(
        dataSlice.actions.updateThings({
          updates: [
            {
              id: thing.id,
              categoryId: categoryId,
              partition: Partition.Unassigned,
            },
          ],
        }),
      );
    },
    [dispatch, thing],
  );

  const handlePartitionSelect = useCallback(
    (partition: Partition) => {
      dispatch(
        dataSlice.actions.updateThings({
          updates: [{ id: thing.id, partition }],
        }),
      );
    },
    [dispatch, thing],
  );

  useEffect(() => {
    const data: Array<Array<string | number>> = [];
    const editableData: Array<Array<string | ReactElement>> = [[], [], []];
    Object.entries(thing).forEach((entry) => {
      const [key, value] = entry;

      switch (key) {
        case "name":
          editableData[0] = [
            "Name",
            <TextFieldWithBlur
              hiddenLabel
              value={thing.name}
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
          ];
          break;
        case "categoryId":
          editableData[1] = [
            "Category",
            <ThingCategorySelect
              currentCategory={thing.categoryId}
              callback={handleCategorySelect}
              size="small"
              fullWidth
              variant="standard"
              fontSize="inherit"
              key={key}
            />,
          ];
          break;
        case "partition":
          editableData[2] = [
            "Partition",
            <ImagePartitionSelect
              currentPartition={thing.partition}
              callback={handlePartitionSelect}
              size="small"
              variant="standard"
              fontSize="inherit"
              fullWidth
              key={key}
            />,
          ];
          break;
        case "kind":
          data.push(["Kind", renderedKindName(thing.kind)]);
          break;
        case "shape":
          Object.entries(value).forEach((shapeEntry) => {
            data.push([shapeEntry[0] as string, shapeEntry[1] as string]);
          });
          break;
        case "containing": {
          const values = value as unknown;
          data.push([key as string, (values as any[]).length]);
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
    thing,
    handleCategorySelect,
    handleImageNameChange,
    handlePartitionSelect,
  ]);

  return (
    <DataTable title={thing.name} collapsible={collapsible}>
      <>
        {tableData.map((row, idx) => {
          return (
            <DataTableRow
              key={`thing-info-table-${thing.id}-row-${idx}`}
              rowId={`thing-info-table-${thing.id}-row-${idx}`}
              rowData={row}
            />
          );
        })}
      </>
    </DataTable>
  );
};
