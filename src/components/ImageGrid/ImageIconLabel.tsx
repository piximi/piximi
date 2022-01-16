import { Tooltip } from "@mui/material";
import LabelImportantIcon from "@mui/icons-material/LabelImportant";
import LabelIcon from "@mui/icons-material/Label";
import { useSelector } from "react-redux";
import { Category, UNKNOWN_CATEGORY_ID } from "../../types/Category";
import { Image } from "../../types/Image";
import { Partition } from "../../types/Partition";
import { categoriesSelector } from "../../store/selectors/categoriesSelector";

type ImageIconLabelProps = {
  image: Image;
};

export const ImageIconLabel = ({ image }: ImageIconLabelProps) => {
  const categories = useSelector(categoriesSelector);

  const color = categories.find((category: Category) => {
    return category.id === image.categoryId;
  })?.color as string;

  const categoryName = categories.find((category: Category) => {
    return category.id === image.categoryId;
  })?.name as string;

  const actionIconStyle = {
    color: color,
    marginLeft: "8px",
    marginTop: "8px",
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
        // can't use "sx" prop directly to access tooltip
        // see: https://github.com/mui-org/material-ui/issues/28679
        componentsProps={{
          tooltip: {
            sx: {
              borderRadius: 2,
              backgroundColor: color,
            },
          },
          arrow: {
            sx: {
              color: color,
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
    </>
  );
};
