import React, { SyntheticEvent } from "react";
import { useDispatch, useSelector } from "react-redux";

import { Autocomplete, TextField } from "@mui/material";

import { projectSlice, selectImageSortType } from "store/project";

import { availableImageSortKeys, ImageSortKeyType, ImageSortKey } from "types";

export const ImageSortSelection = () => {
  const dispatch = useDispatch();

  const selectedImageSortKey = useSelector(selectImageSortType);

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

  return (
    <>
      <Autocomplete
        sx={{ mt: 1, width: 200 }}
        size="small"
        disableClearable={true}
        options={availableImageSortKeys}
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
