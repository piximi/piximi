import clsx from "clsx";
import Container from "@material-ui/core/Container";
import GridList from "@material-ui/core/GridList";
import { Image, State } from "./store";
import GridListTile from "@material-ui/core/GridListTile";
import GridListTileBar from "@material-ui/core/GridListTileBar";
import IconButton from "@material-ui/core/IconButton";
import { bindTrigger, usePopupState } from "material-ui-popup-state/hooks";
import LabelOutlinedIcon from "@material-ui/icons/LabelOutlined";
import React from "react";
import { useStyles } from "./index.css";
import { useSelector } from "react-redux";
import { ImageDialog } from "./ImageDialog";
import { ImageCategoryMenu } from "./ImageCategoryMenu";
import { TransitionProps } from "@material-ui/core/transitions";
import Slide from "@material-ui/core/Slide";

type ImageGridProps = {
  openDrawer: boolean;
};

const DialogTransition = React.forwardRef(
  (
    props: TransitionProps & { children?: React.ReactElement },
    ref: React.Ref<unknown>
  ) => {
    return <Slide direction="right" ref={ref} {...props} />;
  }
);

export const ImageGrid = ({ openDrawer }: ImageGridProps) => {
  const images = useSelector((state: State) => {
    return state.project.images;
  });

  const [openImageDialog, setOpenImageDialog] = React.useState(false);

  const [openedImage, setOpenedImage] = React.useState<Image>(images[0]);

  const onOpenImageDialog = (photo: Image) => {
    setOpenedImage(photo);
    setOpenImageDialog(true);
  };

  const onCloseImageDialog = () => {
    setOpenImageDialog(false);
  };

  const photoCategoryMenuState = usePopupState({
    popupId: "photo-category-menu",
    variant: "popover",
  });

  const classes = useStyles();

  return (
    <React.Fragment>
      <main className={clsx(classes.main, { [classes.mainShift]: openDrawer })}>
        <Container className={classes.container} maxWidth="md">
          <GridList className={classes.gridList} cols={4}>
            {images.map((photo: Image) => (
              <GridListTile
                key={photo.id}
                onClick={() => onOpenImageDialog(photo)}
              >
                <img alt="" src={photo.src} />

                <GridListTileBar
                  actionIcon={
                    <IconButton
                      className={classes.gridTileBarIconButton}
                      disableRipple
                      {...bindTrigger(photoCategoryMenuState)}
                    >
                      <LabelOutlinedIcon />
                    </IconButton>
                  }
                  actionPosition="left"
                  className={classes.gridTileBar}
                  titlePosition="top"
                />
              </GridListTile>
            ))}
          </GridList>
        </Container>
      </main>

      <ImageDialog
        TransitionComponent={DialogTransition}
        onClose={onCloseImageDialog}
        open={openImageDialog}
        photo={openedImage}
      />

      <ImageCategoryMenu menu={photoCategoryMenuState} />
    </React.Fragment>
  );
};
