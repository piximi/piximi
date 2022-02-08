import React, { SyntheticEvent } from "react";
import { Autocomplete, TextField } from "@mui/material";
import { availableImageSortKeys, ImageSortKeyType } from "types/ImageSortType";
import { projectSlice } from "store/slices";
import { useDispatch, useSelector } from "react-redux";
import { imageSortKeySelector } from "store/selectors/imageSortKeySelector";

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
        getOptionLabel={(option: ImageSortKeyType) => option.imageSortKeyName}
        renderInput={(params) => (
          <TextField {...params} autoComplete="off" label="Order images by:" />
        )}
        value={selectedImageSortKey}
      />
    </>
  );
};
