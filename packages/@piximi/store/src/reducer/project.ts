import {Category, Image, Project} from "@piximi/types";
import {createReducer} from "@reduxjs/toolkit";

const findCategoryIndex = (
  categories: Array<Category>,
  identifier: string
): number => {
  return categories.findIndex(
    (category: Category) => category.identifier === identifier
  );
};

const findImageIndex = (images: Array<Image>, identifier: string): number => {
  return images.findIndex((image: Image) => image.identifier === identifier);
};

const state: Project = {
  categories: [],
  images: [],
  name: "Untitled classifier"
};

const unknownCategory: Category = {
  description: "Unknown",
  identifier: "00000000-0000-0000-0000-000000000000",
  index: 0,
  visualization: {
    color: "rgb(233, 165, 177)",
    visible: true
  }
};

state.categories.push(unknownCategory);

export const reducer = createReducer(state, {
  PROJECT_CREATE_CATEGORY: (state, action) => {
    const {category} = action.payload;

    state.categories.push(category);
  },
  PROJECT_CREATE_IMAGE: (state, action) => {
    const {image} = action.payload;

    state.images.push(image);
  },
  PROJECT_CREATE_IMAGES: (state, action) => {
    const {images} = action.payload;

    images.forEach((image: Image) => state.images.push(image));
  },
  PROJECT_CREATE_PROJECT: (state, action) => {
    const {project} = action.payload;

    state.categories = project.categories;
    state.images = project.images;
    state.name = project.name;
  },
  PROJECT_DELETE_CATEGORY: (state, action) => {
    const {category} = action.payload;

    const identifier: string = category.identifier;

    state.categories = state.categories.filter((category: Category) => {
      return category.identifier !== identifier;
    });

    state.images = state.images.map((image: Image) => {
      if (image.categoryIdentifier === identifier) {
        image.categoryIdentifier = "00000000-0000-0000-0000-000000000000";
      }

      return image;
    });
  },
  PROJECT_DELETE_IMAGE: (state, action) => {
    state.images = state.images.filter((image: Image) => {
      return image.identifier !== action.payload.image.identifier;
    });
  },
  PROJECT_OPEN_PROJECT: (state, action) => {
    const {project} = action.payload;

    state.categories = project.categories;
    state.images = project.images;
    state.name = project.name;
  },
  PROJECT_TOGGLE_CATEGORY_VISIBILITY: (state, action) => {
    const {category} = action.payload;

    const index: number = findCategoryIndex(
      state.categories,
      category.identifier
    );

    state.categories[index].visualization.visible = !state.categories[index]
      .visualization.visible;
  },
  PROJECT_UPDATE_CATEGORY_COLOR: (state, action) => {
    const {category, color} = action.payload;

    const index: number = findCategoryIndex(
      state.categories,
      category.identifier
    );

    state.categories[index].visualization.color = color;
  },
  PROJECT_UPDATE_CATEGORY_DESCRIPTION: (state, action) => {
    const {category, description} = action.payload;

    const index: number = findCategoryIndex(
      state.categories,
      category.identifier
    );

    state.categories[index].description = description;
  },
  PROJECT_UPDATE_CATEGORY_VISIBILITY: (state, action) => {
    const {category, visible} = action.payload;

    const index: number = findCategoryIndex(
      state.categories,
      category.identifier
    );

    state.categories[index].visualization.visible = visible;
  },
  PROJECT_UPDATE_IMAGE_BRIGHTNESS: (state, action) => {
    const {image, brightness} = action.payload;

    const index: number = findImageIndex(state.images, image.identifier);

    state.images[index].visualization.brightness = brightness;
  },
  PROJECT_UPDATE_IMAGE_CATEGORY: (state, action) => {
    const {image, category} = action.payload;

    const index: number = findImageIndex(state.images, image.identifier);

    state.images[index].categoryIdentifier = category.identifier;
  },
  PROJECT_UPDATE_IMAGE_CONTRAST: (state, action) => {
    const {image, contrast} = action.payload;

    const index: number = findImageIndex(state.images, image.identifier);

    state.images[index].visualization.contrast = contrast;
  },
  PROJECT_UPDATE_IMAGES_CATEGORY: (state, action) => {
    const {images, category} = action.payload;

    images.forEach((image: Image) => {
      const index: number = findImageIndex(state.images, image.identifier);

      state.images[index].categoryIdentifier = category.identifier;
    });
  },
  PROJECT_UPDATE_IMAGES_PARTITIONS: (state, action) => {
    const {images, partitions} = action.payload;

    images.forEach((image: Image, index: number) => {
      const imageIndex: number = findImageIndex(state.images, image.identifier);

      state.images[imageIndex].partition = partitions[index];
    });
  },
  PROJECT_UPDATE_IMAGES_VISIBILITY: (state, action) => {
    const {images, visible} = action.payload;

    images.forEach((image: Image) => {
      const index: number = findImageIndex(state.images, image.identifier);

      state.images[index].visualization.visible = visible;
    });
  },
  PROJECT_UPDATE_NAME: (state, action) => {
    const {name} = action.payload;

    state.name = name;
  }
});
