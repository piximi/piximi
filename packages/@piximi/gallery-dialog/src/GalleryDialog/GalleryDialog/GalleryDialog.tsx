import * as React from "react";
import {styles} from "./GalleryDialog.css";
import classNames from "classnames";
import {ConnectedGalleryDialogAppBar} from "../GalleryDialogAppBar";
import HTML5Backend from "react-dnd-html5-backend";
import {DndProvider} from "react-dnd";
import {useDrawer} from "@piximi/hooks";
import {makeStyles} from "@material-ui/styles";
import {ConnectedGalleryDialogImageList} from "../GalleryDialogImageList";
import {NavigationDrawer} from "@piximi/navigation-drawer";
import {Category, Image} from "@piximi/types";

// @ts-ignore
const useStyles = makeStyles(styles);

type Props = {
  updateImageCategory: (image: Image, category: Category) => void;
};

export const GalleryDialog = (props: Props) => {
  const classes = useStyles({});

  const [selectedImages, setSelectedImages] = React.useState([]);
  const {openedDrawer, toggleDrawer} = useDrawer();

  const {updateImageCategory} = props;

  return (
    <DndProvider backend={HTML5Backend}>
      <div className={classes.appFrame}>
        <ConnectedGalleryDialogAppBar
          selectedImages={selectedImages}
          setSelectedImages={setSelectedImages}
          toggle={toggleDrawer}
          toggled={openedDrawer}
        />
        <NavigationDrawer toggled={openedDrawer} toggle={toggleDrawer} />
        <main
          className={classNames(classes.content, classes.contentLeft, {
            [classes.contentShift]: openedDrawer,
            [classes.contentShiftLeft]: openedDrawer
          })}
        >
          <div className={classes.drawerHeader} />
          <ConnectedGalleryDialogImageList
            selectedImages={selectedImages}
            imagesPerRow={10}
            decreaseWidth={openedDrawer ? 280 + 24 : 24}
            callOnDragEnd={updateImageCategory}
            setSelectedImages={setSelectedImages}
          />
        </main>
      </div>
    </DndProvider>
  );
};
