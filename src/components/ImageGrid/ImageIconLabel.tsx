import { useSelector } from "react-redux";

import { Box, Tooltip } from "@mui/material";

import LabelImportantIcon from "@mui/icons-material/LabelImportant";
import LabelIcon from "@mui/icons-material/Label";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";

import { categoriesSelector } from "store/selectors/categoriesSelector";

import { Category, UNKNOWN_CATEGORY_ID } from "types/Category";
import { ImageType } from "types/ImageType";
import { Partition } from "types/Partition";

type ImageIconLabelProps = {
  image: ImageType;
};

export const ImageIconLabel = ({ image }: ImageIconLabelProps) => {
  const categories = useSelector(categoriesSelector);

  const { color: categoryColor, name: categoryName } = categories.find(
    (category: Category) => {
      return category.id === image.categoryId;
    }
  ) ?? { color: "undefined", name: "undefined" };

  const actionIconStyle = {
    color: categoryColor,
    marginLeft: "8px",
    marginTop: "8px",
  };

  const infoIconTooltip = () => {
    return (
      <div>
        {`file name: ${image.name}`}
        <br></br>
        {`shape: ${image.shape.width} x ${image.shape.height}`}
        <br></br>
        {`channels: ${image.shape.channels}`}
        <br></br>
        {`z-slices: ${image.shape.planes}`}
      </div>
    );
  };

  const predictedLabel =
    image.partition === Partition.Inference &&
    image.categoryId !== UNKNOWN_CATEGORY_ID;

  return (
    <>
      <Tooltip
        title={categoryName}
        placement="right"
        arrow
        componentsProps={{
          tooltip: {
            sx: {
              borderRadius: 2,
              backgroundColor: categoryColor,
            },
          },
          arrow: {
            sx: {
              color: categoryColor,
            },
          },
        }}
      >
        {predictedLabel ? (
          <LabelImportantIcon sx={actionIconStyle} />
        ) : (
          <LabelIcon sx={actionIconStyle} />
        )}
      </Tooltip>

      <Box sx={{ flexGrow: 1 }} />

      <Tooltip
        title={infoIconTooltip()}
        placement="right"
        arrow
        componentsProps={{
          tooltip: {
            sx: {
              borderRadius: 2,
              backgroundColor: categoryColor,
            },
          },
          arrow: {
            sx: {
              color: categoryColor,
            },
          },
        }}
      >
        <InfoOutlinedIcon sx={actionIconStyle} />
      </Tooltip>
    </>
  );
};
