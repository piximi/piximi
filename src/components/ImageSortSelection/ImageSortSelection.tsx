import React, { SyntheticEvent } from "react";
import { useDispatch, useSelector } from "react-redux";

import { Autocomplete, TextField } from "@mui/material";

import { imageSortKeySelector } from "store/selectors/imageSortKeySelector";

import { projectSlice } from "store/slices";

import {
  availableImageSortKeys,
  ImageSortKeyType,
  ImageSortKey,
} from "types/ImageSortType";

export const ImageSortSelection = () => {
  const dispatch = useDispatch();

  const [selectedImageSortKey, setSelectedImageSortKey] =
    React.useState<ImageSortKeyType>(useSelector(imageSortKeySelector));

  const onImageSortKeyChange = (
    event: SyntheticEvent<Element, Event>,
    value: ImageSortKeyType | null
  ) => {
    const selectedSortKey = value as ImageSortKeyType;
    setSelectedImageSortKey(selectedSortKey);

    dispatch(
      projectSlice.actions.sortImagesBySelectedKey({
        imageSortKey: selectedSortKey,
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
