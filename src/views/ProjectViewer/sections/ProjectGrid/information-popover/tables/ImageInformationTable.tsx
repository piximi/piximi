import { useCallback, useEffect, useMemo, useState } from "react";

import { useDispatch } from "react-redux";

import { useBackend } from "core/backend";

import { TextFieldWithBlur } from "components/inputs";

import { useParameterizedSelector } from "store/hooks";
import {
  selectAnnotationVolumesByImageId,
  selectExtendedImageById,
  selectPlanesByImageId,
} from "store/data/selectors";
import { dataSlice } from "store/data";

import {
  ImagePlaneSelect,
  ItemCategorySelect,
  ItemPartitionSelect,
  SimpleLabel,
} from "./cells";
import { ItemInformationTable } from "./ItemInformationTable";
import { useImageGridItem } from "../../useGridItems";

import type { ReactElement } from "react";

import type { ImageRecord } from "core/backend";
import type { ExtendedImageObject } from "core/entities";
import type { Partition } from "core/dl/enums";

export const ImagePopoverContent = ({
  itemId,
  record,
  onMissing,
}: {
  itemId: string;
  record?: ImageRecord;
  onMissing: () => void;
}) => {
  const fromStore = useParameterizedSelector(selectExtendedImageById, itemId);
  // The grid's record stands in for an image the store has not mirrored yet.
  const fromRecord = useImageGridItem(record);
  const image = fromStore ?? fromRecord;
  useEffect(() => {
    if (!image) onMissing();
  }, [image, onMissing]);
  if (!image) return null;
  return <ImageInfoTable image={image} />;
};

const ImageInfoTable = ({ image }: { image: ExtendedImageObject }) => {
  const dispatch = useDispatch();
  const backend = useBackend();

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
      dataSlice.actions.updateImageName({
        imageId: image.id,
        name: newImageName,
      }),
    );
  }, [dispatch, newImageName, image.id]);

  // Through the backend, which owns the category and is where the grid and
  // the sidebar's counts read from; a store-only change would show here alone.
  const handleCategorySelect = useCallback(
    (categoryId: string) => {
      backend.images
        .categorize({ ids: [image.id] }, categoryId)
        .catch((error) => console.error("[ImageInfoTable] categorize", error));
    },
    [backend, image.id],
  );

  const handlePartitionSelect = useCallback(
    (partition: Partition) => {
      dispatch(
        dataSlice.actions.updateImagePartition({
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
        dataSlice.actions.updateImageActivePlane({
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
        value={newImageName}
        onChange={handleNameChange}
        onBlur={handleDispatchNameChange}
        size="small"
        variant="standard"
        slotProps={{
          htmlInput: {
            style: {
              textAlign: "right",
              font: "var(--mui-font-body2)",
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
  }, [
    image,
    handleCategorySelect,
    handleNameChange,
    handlePartitionSelect,
    handleDispatchNameChange,
    handlePlaneSelect,
    planes,
    volumes.length,
    newImageName,
  ]);

  return <ItemInformationTable title={image.name} data={tableData} />;
};
