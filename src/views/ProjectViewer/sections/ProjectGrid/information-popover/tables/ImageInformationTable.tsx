import type { ReactElement } from "react";
import { useCallback, useEffect, useMemo, useState } from "react";

import { useDispatch } from "react-redux";

import { useTheme } from "@mui/material";

import { TextFieldWithBlur } from "components/inputs";

import { dataSlice } from "store/data/dataSlice";
import type { ExtendedImageObject } from "store/dataV2/types";
import { useParameterizedSelector } from "store/hooks";
import {
  selectAnnotationVolumesByImageId,
  selectExtendedImageById,
  selectPlanesByImageId,
} from "store/dataV2/selectors";
import { dataSliceV2 } from "store/dataV2";

import type { Partition } from "utils/modelsV2/enums";

import {
  ImagePlaneSelect,
  ItemCategorySelect,
  ItemPartitionSelect,
  SimpleLabel,
} from "./cells";
import { ItemInformationTable } from "./ItemInformationTable";

export const ImagePopoverContent = ({
  itemId,
  onMissing,
}: {
  itemId: string;
  onMissing: () => void;
}) => {
  const image = useParameterizedSelector(selectExtendedImageById, itemId);
  useEffect(() => {
    if (!image) onMissing();
  }, [image, onMissing]);
  if (!image) return null;
  return <ImageInfoTable image={image} />;
};

export const ImageInfoTable = ({ image }: { image: ExtendedImageObject }) => {
  const dispatch = useDispatch();
  const theme = useTheme();
  const volumes = useParameterizedSelector(
    selectAnnotationVolumesByImageId,
    image.id,
  );
  const planes = useParameterizedSelector(selectPlanesByImageId, image.id);

  const [newImageName, setNewImageName] = useState<string>(image.name);

  const handleNameChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      setNewImageName(event.target.value);
    },
    [],
  );

  const handleDispatchNameChange = useCallback(() => {
    dispatch(
      dataSlice.actions.updateThingName({
        id: image.id,
        name: newImageName,
      }),
    );
  }, [dispatch, newImageName, image.id]);

  const handleCategorySelect = useCallback(
    (categoryId: string) => {
      dispatch(
        dataSliceV2.actions.updateImageCategory({
          id: image.id,
          categoryId: categoryId,
        }),
      );
    },
    [dispatch, image],
  );

  const handlePartitionSelect = useCallback(
    (partition: Partition) => {
      dispatch(
        dataSliceV2.actions.updateImagePartition({
          id: image.id,
          partition,
        }),
      );
    },
    [dispatch, image],
  );
  const handlePlaneSelect = useCallback(
    (idx: number) => {
      dispatch(
        dataSliceV2.actions.updateImageActivePlane({
          imageId: image.id,
          planeId: planes[idx].id,
        }),
      );
    },
    [dispatch, image, planes],
  );

  const tableData = useMemo(() => {
    const data: Array<Array<string | number | ReactElement>> = [];

    data.push([
      "Name",
      <TextFieldWithBlur
        hiddenLabel
        value={image.name}
        onChange={handleNameChange}
        onBlur={handleDispatchNameChange}
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
        key={"name"}
      />,
    ]);

    data.push([
      "Category",
      <ItemCategorySelect
        currentCategory={image.categoryId}
        callback={handleCategorySelect}
        key={"categoryId"}
      />,
    ]);
    data.push([
      "Partition",
      <ItemPartitionSelect
        currentPartition={image.partition}
        callback={handlePartitionSelect}
        key={"partition"}
      />,
    ]);

    Object.entries(image.shape).forEach((shapeEntry) => {
      data.push([shapeEntry[0] as string, shapeEntry[1] + ""]);
    });
    data.push([
      "Total Objects",
      <SimpleLabel value={volumes.length} key={"volumes"} />,
    ]);

    data.push([
      "Active Plane",
      <ImagePlaneSelect
        currentIndex={image.activePlaneIdx}
        indexOptions={planes.map((p) => p.zIndex)}
        callback={handlePlaneSelect}
        key={"activePlaneIdx"}
      />,
    ]);

    return data;
  }, [image, handleCategorySelect, handleNameChange, handlePartitionSelect]);

  return <ItemInformationTable title={image.name} data={tableData} />;
};
