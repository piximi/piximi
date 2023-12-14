import { DataTable, DataTableRow } from "components/data-viz";
import {
  BlurActionTextField,
  ImageCategorySelect,
  ImagePartitionSelect,
} from "components/styled-components/inputs";
import { ReactElement, useCallback, useEffect, useState } from "react";
import { useDispatch } from "react-redux";
import { dataSlice } from "store/slices/data";
import { ImageType, Partition } from "types";

export const ImageInformationTable = ({
  image,
  collapsible,
}: {
  image: ImageType;
  collapsible: boolean;
}) => {
  const dispatch = useDispatch();
  const [tableData, setTableData] = useState<
    Array<Array<string | number | ReactElement>>
  >([]);

  const handleImageNameChange = useCallback(
    (name: string) => {
      dispatch(
        dataSlice.actions.updateImages({
          updates: [{ id: image.id, name }],
          isPermanent: true,
        })
      );
    },
    [dispatch, image]
  );

  const handleCategorySelect = useCallback(
    (categoryId: string) => {
      dispatch(
        dataSlice.actions.updateImages({
          updates: [{ id: image.id, categoryId: categoryId }],
          isPermanent: true,
        })
      );
    },
    [dispatch, image]
  );

  const handlePartitionSelect = useCallback(
    (partition: Partition) => {
      dispatch(
        dataSlice.actions.updateImages({
          updates: [{ id: image.id, partition }],
          isPermanent: true,
        })
      );
    },
    [dispatch, image]
  );

  useEffect(() => {
    const data: Array<Array<string | number>> = [];
    const editableData: Array<Array<string | ReactElement>> = [[], [], []];
    Object.entries(image).forEach((entry) => {
      let [key, value] = entry;

      switch (key) {
        case "name":
          editableData[0] = [
            "Name",
            <BlurActionTextField
              hiddenLabel
              currentText={image.name}
              callback={handleImageNameChange}
              size="small"
              variant="standard"
              fontSize={"inherit"}
              textAlign="right"
            />,
          ];
          break;
        case "categoryId":
          editableData[1] = [
            "Category",
            <ImageCategorySelect
              currentCategory={image.categoryId}
              callback={handleCategorySelect}
              size="small"
              variant="standard"
              fontSize="inherit"
            />,
          ];
          break;
        case "partition":
          editableData[2] = [
            "Partition",
            <ImagePartitionSelect
              currentPartition={image.partition}
              callback={handlePartitionSelect}
              size="small"
              variant="standard"
              fontSize="inherit"
            />,
          ];
          break;
        case "shape":
          Object.entries(value).forEach((shapeEntry) => {
            data.push([shapeEntry[0] as string, shapeEntry[1] as string]);
          });
          break;
        case "colors":
        case "visible":
        case "src":
        case "id":
        case "data":
          break;
        default:
          data.push([key as string, value as string]);
      }
    });
    setTableData([...editableData, ...data]);
  }, [
    image,
    handleCategorySelect,
    handleImageNameChange,
    handlePartitionSelect,
  ]);

  return (
    <DataTable title={image.name} collapsible={collapsible}>
      <>
        {tableData.map((row, idx) => {
          return (
            <DataTableRow
              key={`image-info-table-${image.id}-row-${idx}`}
              rowId={`image-info-table-${image.id}-row-${idx}`}
              rowData={row}
            />
          );
        })}
      </>
    </DataTable>
  );
};
