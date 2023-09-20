import React, { SyntheticEvent, useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";

import { Autocomplete, TextField } from "@mui/material";

import {
  projectSlice,
  selectImageGridTab,
  selectImageSortType,
} from "store/project";

import { availableImageSortKeys, ImageSortKeyType, ImageSortKey } from "types";

export const ImageSortSelection = () => {
  const dispatch = useDispatch();
  const imageGridTab = useSelector(selectImageGridTab);

  const selectedImageSortKey = useSelector(selectImageSortType);

  const [filteredSortKeys, setFilteredSortKeys] = useState<
    Array<ImageSortKeyType>
  >([]);

  const onImageSortKeyChange = (
    event: SyntheticEvent<Element, Event>,
    value: ImageSortKeyType | null
  ) => {
    const selectedSortKey = value as ImageSortKeyType;

    dispatch(
      projectSlice.actions.sortImagesBySelectedKey({
        imageSortKey: selectedSortKey.imageSortKey,
      })
    );
  };

  useEffect(() => {
    const _filteredSortKEys = availableImageSortKeys.filter(
      (sortKey) =>
        sortKey.objectType === imageGridTab || sortKey.objectType === "All"
    );
    setFilteredSortKeys(_filteredSortKEys);
  }, [imageGridTab]);

  return (
    <>
      <Autocomplete
        sx={{ mt: 1, width: 200 }}
        size="small"
        disableClearable={true}
        options={filteredSortKeys}
        onChange={onImageSortKeyChange}
        isOptionEqualToValue={(option, value) =>
          option.imageSortKey === value.imageSortKey ||
          ImageSortKey.None === value.imageSortKey
        }
        getOptionLabel={(option: ImageSortKeyType) => option.imageSortKeyName}
        renderInput={(params) => (
          <TextField {...params} autoComplete="off" label="Order images by:" />
        )}
        value={selectedImageSortKey}
      />
    </>
  );
};
