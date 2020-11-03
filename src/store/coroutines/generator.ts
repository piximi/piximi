import { Image } from "../../types/Image";
import { Category } from "../../types/Category";

export const generator = (
  images: Array<Image>,
  categories: Array<Category>
) => {
  const count = images.length;

  return function* () {
    let index = 0;

    while (index < count) {
      const image = images[index];

      const ys = categories
        .filter((category: Category) => {
          return category.id !== "00000000--0000-0000-00000000000";
        })
        .findIndex((category: Category) => {
          return category.id === image.categoryId;
        });

      yield {
        xs: image.src,
        ys: ys,
      };

      index++;
    }
  };
};
