import { useCallback, useEffect, useMemo, useState } from "react";

import { useBackend } from "core/backend";

import { TextFieldWithBlur } from "components/inputs";

import { useParameterizedSelector } from "store/hooks";
import {
  selectAnnotationVolumesByImageId,
  selectExtendedImageById,
  selectPlanesByImageId,
} from "store/data/selectors";

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

  // Through the backend, which owns the image; the store follows its
  // announcement, so the grid and this table agree.
  const report = (what: string) => (error: unknown) =>
    console.error(`[ImageInfoTable] ${what}`, error);
  const handleDispatchNameChange = useCallback(() => {
    if (!newImageName.trim() || newImageName === image.name) return;
    backend.images
      .update([{ id: image.id, name: newImageName }])
      .catch(report("rename"));
  }, [backend, newImageName, image.id, image.name]);

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
      backend.images
        .update([{ id: image.id, partition }])
        .catch(report("set partition"));
    },
    [backend, image.id],
  );
  const handlePlaneSelect = useCallback(
    (idx: number) => {
      backend.images
        .update([{ id: image.id, activePlaneId: planes[idx].id }])
        .catch(report("change plane"));
    },
    [backend, image.id, planes],
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
