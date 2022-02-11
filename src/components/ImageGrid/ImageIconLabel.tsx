import { Tooltip } from "@mui/material";
import LabelImportantIcon from "@mui/icons-material/LabelImportant";
import LabelIcon from "@mui/icons-material/Label";
import { useSelector } from "react-redux";
import { Category, UNKNOWN_CATEGORY_ID } from "../../types/Category";
import { ImageType } from "../../types/ImageType";
import { Partition } from "../../types/Partition";
import { categoriesSelector } from "../../store/selectors/categoriesSelector";

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

  const predictedLabel =
    image.partition === Partition.Inference &&
    image.categoryId !== UNKNOWN_CATEGORY_ID;

  return (
    <Tooltip
      title={categoryName}
      placement="right"
      arrow
      // can't use "sx" prop directly to access tooltip
      // see: https://github.com/mui-org/material-ui/issues/28679
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
  );
};
