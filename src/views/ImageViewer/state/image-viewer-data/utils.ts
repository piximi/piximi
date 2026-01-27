import { productionStore } from "store";
import { ImageMetadata, ImageObject } from "store/data/types";
import { RootState } from "store/rootReducer";
import { groupBy } from "utils/arrayUtils";
import { createRenderedTensor } from "utils/tensorUtils";
import { ColorsRaw } from "utils/types";
import {
  ImageViewerImageProperties,
  ImageViewerMetadataDetails,
} from "./types";
import { imageViewerDataSlice } from "./ImageViewerDataSlice";
import { annotatorSlice } from "../annotator";

export const getRenderedSources = async (
  metadata: ImageMetadata,
  imageData: ImageObject[],
  activePlane: number,
  activeimageId: string,
  ZTColors: Record<string, { colors: ColorsRaw }> | ColorsRaw,
): Promise<{ activeSrcs: string[]; ZTPreviews: Record<string, string> }> => {
  const ZTPreviews: Record<string, string> = {};
  const getColors = (id: string) => {
    if ("color" in ZTColors) {
      return ZTColors as ColorsRaw;
    }
    return ZTColors[id].colors;
  };
  for await (const img of imageData) {
    const id = img.id;
    const ZTPreview = await createRenderedTensor(
      img.data,
      getColors(id),
      metadata.shape.channels,
      metadata.bitDepth,
      activePlane,
    );
    ZTPreviews[id] = ZTPreview;
  }
  const activeImage = imageData.find((img) => img.id === activeimageId)!;
  const activeSrcs = await createRenderedTensor(
    activeImage.data,
    getColors(activeimageId),
    metadata.shape.channels,
    metadata.bitDepth,
    undefined,
  );

  return { activeSrcs, ZTPreviews };
};

export const prepareImageViewerData = async (initialData: {
  images: string[];
  annotations: string[];
}) => {
  const { images: initialImageIds, annotations: annotationIds } = initialData;
  const { data: dataState } = productionStore.getState() as RootState;
  if (initialImageIds.length === 0 && annotationIds.length === 0) return;

  // If annotations are selected in the project view, load the images they came from
  const imageIdsFromAnn = annotationIds.reduce(
    (annImageIds: string[], annotationId) => {
      const annotation = dataState.annotations.entities[annotationId];
      if (!annotation) {
        console.error(`Annotation with id ${annotationId} does not exist`);
        return annImageIds;
      }
      annImageIds.push(annotation.imageId);
      return annImageIds;
    },
    [],
  );

  // If both images and annotations are selected, merge the two lists
  // imageIdsFromAnn is first to ensure that initial active image contains the working annotation, if any
  const imageData: ImageObject[] = [];
  new Set([...imageIdsFromAnn, ...initialImageIds]).forEach((id) =>
    imageData.push(dataState.images.entities[id]),
  );

  const activeMetadataId = imageData[0].metadataId;
  const metadataToSelectedImages = groupBy(imageData, "metadataId");

  const metadataStack: Record<string, ImageViewerMetadataDetails> = {};

  for await (const metadataId of Object.keys(metadataToSelectedImages)) {
    const imageMetadata = dataState.metadata.entities[metadataId];
    const activeImage = metadataToSelectedImages[metadataId][0];

    const relatedImageData: ImageObject[] = [];

    // Gather metadata images and colors
    const activeImageDataSet = imageMetadata.imageDataIds.reduce(
      (set: Record<string, ImageObject>, id) => {
        set[id] = dataState.images.entities[id];
        return set;
      },
      {},
    );

    let timeSortedImageData: ImageObject[] | undefined;
    // if time series, sort by timepoint before storing
    if (imageMetadata.timeSeries)
      timeSortedImageData = Object.values(activeImageDataSet).sort(
        (a, b) => a.timepoint! - b.timepoint!,
      );

    // Get rendered sources for all planes of active image, and for z = 0 for all others
    const { activeSrcs, ZTPreviews } = await getRenderedSources(
      imageMetadata,
      timeSortedImageData ?? Object.values(activeImageDataSet),
      0,
      activeImage.id,
      activeImageDataSet,
    );

    metadataStack[metadataId] = {
      id: metadataId,
      name: imageMetadata.name,
      activePlane: 0,
      activeImageId: activeImage.id,
      activeSrcs,
      timeSeries: imageMetadata.timeSeries,
      images: (timeSortedImageData ?? relatedImageData).reduce(
        (tpProps: Record<string, ImageViewerImageProperties>, image) => {
          tpProps[image.id] = {
            id: image.id,
            timepoint: image.timepoint,
            categoryId: image.categoryId,
            ZTPreview: ZTPreviews[image.id],
          };
          return tpProps;
        },
        {},
      ),
    };
  }

  productionStore.dispatch(
    imageViewerDataSlice.actions.setMetadataStack(metadataStack),
  );
  productionStore.dispatch(
    imageViewerDataSlice.actions.setSelectedAnnotationIds(annotationIds),
  );
  productionStore.dispatch(
    annotatorSlice.actions.setWorkingAnnotation({
      annotation: annotationIds[0],
    }),
  );
  productionStore.dispatch(
    imageViewerDataSlice.actions.setActiveMetadataId({
      metadataId: activeMetadataId,
      prevMetadataId: undefined,
    }),
  );
};
