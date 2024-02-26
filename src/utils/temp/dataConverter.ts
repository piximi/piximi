import { DeferredEntityState } from "store/entities";
import { AnnotationType, Category, ImageType, Partition, Shape } from "types";
import { NewAnnotationType } from "types/AnnotationType";
import {
  Kind,
  NEW_UNKNOWN_CATEGORY,
  NEW_UNKNOWN_CATEGORY_ID,
  NewCategory,
  UNKNOWN_ANNOTATION_CATEGORY_ID,
  UNKNOWN_IMAGE_CATEGORY_ID,
} from "types/Category";
import { NewImageType } from "types/ImageType";

export const dataConverter = (data: {
  images: ImageType[];
  oldCategories: Category[];
  annotationCategories: Category[];
  annotations: AnnotationType[];
}) => {
  const { images, oldCategories, annotationCategories, annotations } = data;
  const categories: DeferredEntityState<NewCategory> = {
    ids: [],
    entities: {},
  };
  const things: DeferredEntityState<NewImageType | NewAnnotationType> = {
    ids: [],
    entities: {},
  };
  const kinds: DeferredEntityState<Kind> = { ids: [], entities: {} };

  kinds.ids.push("Image");

  kinds.entities["Image"] = {
    saved: {
      id: "Image",
      containing: [],
      categories: [NEW_UNKNOWN_CATEGORY_ID],
    },
    changes: {},
  };
  categories.ids.push(NEW_UNKNOWN_CATEGORY_ID);
  categories.entities[NEW_UNKNOWN_CATEGORY_ID] = {
    saved: {
      ...NEW_UNKNOWN_CATEGORY,
      containing: [],
    },
    changes: {},
  };
  for (const category of oldCategories) {
    if (category.id === UNKNOWN_IMAGE_CATEGORY_ID) {
      continue;
    } else {
      categories.ids.push(category.id);
      categories.entities[category.id] = {
        saved: {
          ...category,
          containing: [],
        } as NewCategory,
        changes: {},
      };
      kinds.entities["Image"].saved.categories.push(category.id);
    }
  }

  for (const image of images) {
    image.kind = "Image";
    kinds.entities["Image"].saved.containing.push(image.id);
    const cat =
      image.categoryId === UNKNOWN_IMAGE_CATEGORY_ID
        ? NEW_UNKNOWN_CATEGORY_ID
        : image.categoryId;
    image.categoryId = cat;
    image.containing = [];

    things.ids.push(image.id);

    things.entities[image.id] = { saved: image as NewImageType, changes: {} };
    if (cat in categories.entities) {
      categories.entities[cat].saved.containing.push(image.id);
    }
  }

  const anCat2KindNAme: Record<string, string> = {};
  for (const anCat of annotationCategories) {
    if (anCat.id === UNKNOWN_ANNOTATION_CATEGORY_ID) continue;
    kinds.ids.push(anCat.name);
    kinds.entities[anCat.name] = {
      saved: {
        id: anCat.name,
        containing: [],
        categories: [],
      },
      changes: {},
    };
    anCat2KindNAme[anCat.id] = anCat.name;
  }

  const numAnnotationsOfKindPerImage: Record<string, number> = {};

  for (const annotation of annotations as NewAnnotationType[]) {
    const { plane, ..._annotation } = {
      ...annotation,
      activePlane: annotation.plane,
    };
    _annotation.kind = anCat2KindNAme[_annotation.categoryId];
    let annotationName: string;
    if (_annotation.imageId in things.entities) {
      annotationName = `${things.entities[_annotation.imageId].saved.name}-${
        _annotation.kind
      }`;
      (
        things.entities[_annotation.imageId].saved as NewImageType
      ).containing.push(_annotation.id);
    } else {
      annotationName = `${_annotation.kind}`;
    }
    if (annotationName in numAnnotationsOfKindPerImage) {
      annotationName += `_${numAnnotationsOfKindPerImage[annotationName]++}`;
    } else {
      numAnnotationsOfKindPerImage[annotationName] = 1;
      annotationName += "_0";
    }
    _annotation.name = annotationName;
    _annotation.categoryId = NEW_UNKNOWN_CATEGORY_ID;
    _annotation.shape = _annotation.data.shape.reduce(
      (shape: Shape, value: number, idx) => {
        switch (idx) {
          case 0:
            shape.planes = value;
            break;
          case 1:
            shape.height = value;
            break;
          case 2:
            shape.width = value;
            break;
          case 3:
            shape.channels = value;
            break;
          default:
            break;
        }
        return shape;
      },
      { planes: 0, height: 0, width: 0, channels: 0 }
    );
    _annotation.partition = Partition.Unassigned;
    things.ids.push(_annotation.id);

    things.entities[_annotation.id] = {
      saved: _annotation as NewAnnotationType,
      changes: {},
    };

    kinds.entities[_annotation.kind].saved.containing.push(_annotation.id);

    categories.entities[NEW_UNKNOWN_CATEGORY_ID].saved.containing.push(
      _annotation.id
    );
  }

  return { kinds, categories, things };
};
