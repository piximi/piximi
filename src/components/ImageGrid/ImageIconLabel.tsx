import { Tooltip } from "@mui/material";
import { makeStyles } from "@mui/styles";
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

  const useStyles = makeStyles(() => ({
    iconLabelTooltip: {
      borderRadius: 2,
      backgroundColor: color,
    },
    customArrow: {
      color: color,
    },
  }));

  const classes = useStyles();

  const predictedLabel =
    image.partition === Partition.Inference &&
    image.categoryId !== UNKNOWN_CATEGORY_ID;

  return (
    <>
      <Tooltip
        title={categoryName}
        placement="right"
        arrow
        classes={{
          tooltip: classes.iconLabelTooltip,
          arrow: classes.customArrow,
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
