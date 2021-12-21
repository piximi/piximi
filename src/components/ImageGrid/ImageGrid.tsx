import { useStyles } from "./ImageGrid.css";
import { useDispatch, useSelector } from "react-redux";
import { Image } from "../../types/Image";
import {
  selectedImagesSelector,
  visibleImagesSelector,
} from "../../store/selectors";
import { tileSizeSelector } from "../../store/selectors/tileSizeSelector";
import { applicationSlice } from "../../store/slices";
import { ImageGridAppBar } from "../ImageGridAppBar";
import {
  Container,
  ImageList,
  ImageListItem,
  ImageListItemBar,
} from "@mui/material";
import { DropTargetMonitor, useDrop } from "react-dnd";
import { NativeTypes } from "react-dnd-html5-backend";
import { ImageIconLabel } from "./imageIconLabel";

type ImageGridProps = {
  onDrop: (item: { files: any[] }) => void;
};

export const ImageGrid = ({ onDrop }: ImageGridProps) => {
  const dispatch = useDispatch();

  const images = useSelector(visibleImagesSelector);

  const selectedImages: Array<string> = useSelector(selectedImagesSelector);

  const max_images = 1000; //number of images from the project that we'll show

  const [{ isOver }, drop] = useDrop(
    () => ({
      accept: [NativeTypes.FILE],
      drop(item: { files: any[] }) {
        if (onDrop) {
          onDrop(item);
        }
      },
      collect: (monitor: DropTargetMonitor) => ({
        isOver: monitor.isOver(),
        canDrop: monitor.canDrop(),
      }),
    }),
    []
  );

  const onSelectImage = (image: Image) => {
    if (selectedImages.includes(image.id)) {
      dispatch(applicationSlice.actions.deselectImage({ id: image.id }));
    } else {
      dispatch(applicationSlice.actions.selectImage({ id: image.id }));
    }
  };

  const classes = useStyles();

  const scaleFactor = useSelector(tileSizeSelector);

  const getSize = (scaleFactor: number) => {
    const width = (220 * scaleFactor).toString() + "px";
    const height = (220 * scaleFactor).toString() + "px";

    return {
      width: width,
      height: height,
      margin: "2px",
    };
  };

  const getSelectionStatus = (imageId: string) => {
    return selectedImages.includes(imageId)
      ? classes.imageSelected
      : classes.imageUnselected;
  };

  return (
    <main
      ref={drop}
      className={classes.main}
      style={{
        border: isOver ? "5px solid blue" : "",
      }}
    >
      <div>
        <Container className={classes.container} maxWidth={false}>
          <ImageList
            className={classes.gridList}
            cols={Math.floor(6 / scaleFactor)}
            rowHeight={"auto"}
          >
            {images.slice(0, max_images).map((image: Image) => (
              <ImageListItem
                key={image.id}
                onClick={() => onSelectImage(image)}
                style={getSize(scaleFactor)}
                className={getSelectionStatus(image.id)}
              >
                <img alt="" src={image.src} className={classes.imageTile} />
                <ImageListItemBar
                  position="top"
                  sx={{
                    background: "transparent",
                  }}
                  actionIcon={<ImageIconLabel image={image} />}
                  actionPosition="left"
                />
              </ImageListItem>
            ))}
          </ImageList>

          <ImageGridAppBar />
        </Container>
      </div>
    </main>
  );
};
