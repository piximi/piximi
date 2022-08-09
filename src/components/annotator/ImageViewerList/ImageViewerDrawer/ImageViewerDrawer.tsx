import Drawer from "@mui/material/Drawer";
import { Category, CategoryType } from "types/Category";
import { unknownAnnotationCategorySelector } from "store/selectors";
import { useDispatch, useSelector } from "react-redux";
import { Divider } from "@mui/material";
import List from "@mui/material/List";
import { AnnotatorHelpDrawer } from "components/common/Help";
import { imageViewerSlice } from "store/slices";
import { createdAnnotatorCategoriesSelector } from "store/selectors/createdAnnotatorCategoriesSelector";
import { AppBarOffset } from "components/styled/AppBarOffset";
import { SendFeedbackListItem } from "components/common/SendFeedbackListItem";
import { CategoriesList } from "components/CategoriesList";
import { ImageViewerAppBar } from "../ImageViewerAppBar";
import { ImageList } from "../ImageList";
import { ClearAnnotationsListItem } from "../ClearAnnotations";
import { OpenListItem } from "../OpenListItem";
import { SaveListItem } from "../SaveListItem";

export const ImageViewerDrawer = () => {
  const createdCategories = useSelector(createdAnnotatorCategoriesSelector);
  const unknownAnnotationCategory = useSelector(
    unknownAnnotationCategorySelector
  );

  const dispatch = useDispatch();

  const onCategoryClickCallBack = (category: Category) => {
    dispatch(
      imageViewerSlice.actions.setSelectedCategoryId({
        selectedCategoryId: category.id,
      })
    );
  };

  return (
    <Drawer
      anchor="left"
      sx={{
        flexShrink: 0,
        width: (theme) => theme.spacing(32),
        "& > .MuiDrawer-paper": {
          width: (theme) => theme.spacing(32),
        },
      }}
      open
      variant="persistent"
    >
      <ImageViewerAppBar />

      <AppBarOffset />

      <Divider />

      <List dense>
        <OpenListItem />
        <SaveListItem />
      </List>

      <Divider />

      <ImageList />

      <Divider />

      <CategoriesList
        createdCategories={createdCategories}
        unknownCategory={unknownAnnotationCategory}
        predicted={false}
        categoryType={CategoryType.AnnotationCategory}
        onCategoryClickCallBack={onCategoryClickCallBack}
      />

      <Divider />

      <ClearAnnotationsListItem />

      <Divider />

      <List dense>
        <SendFeedbackListItem />
        <AnnotatorHelpDrawer />
      </List>
    </Drawer>
  );
};
