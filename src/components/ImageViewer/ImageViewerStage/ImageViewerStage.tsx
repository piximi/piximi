import React from "react";
import { Category } from "../../../types/Category";
import { EllipticalSelection } from "../EllipticalSelection";
import { Image } from "../../../types/Image";
import { LassoSelection } from "../LassoSelection/LassoSelection";
import { MagneticSelection } from "../MagneticSelection";
import { PolygonalSelection } from "../PolygonalSelection/PolygonalSelection";
import { RectangularSelection } from "../RectangularSelection";
import { ImageViewerOperation } from "../../../types/ImageViewerOperation";
import { ObjectSelection } from "../ObjectSelection";
import { QuickSelection } from "../QuickSelection";

type ImageViewerStageProps = {
  operation: ImageViewerOperation;
  data: Image;
  category: Category;
};

export const ImageViewerStage = ({
  operation,
  data,
  category,
}: ImageViewerStageProps) => {
  if (data && data.shape && data.src) {
    switch (operation) {
      case ImageViewerOperation.ColorSelection:
        return <React.Fragment />;
      case ImageViewerOperation.EllipticalSelection:
        return <EllipticalSelection data={data} category={category} />;
      case ImageViewerOperation.LassoSelection:
        return <LassoSelection image={data} category={category} />;
      case ImageViewerOperation.MagneticSelection:
        return <MagneticSelection image={data} />;
      case ImageViewerOperation.ObjectSelection:
        return <ObjectSelection data={data} category={category} />;
      case ImageViewerOperation.PolygonalSelection:
        return <PolygonalSelection image={data} category={category} />;
      case ImageViewerOperation.QuickSelection:
        return <QuickSelection image={data} category={category} />;
      case ImageViewerOperation.RectangularSelection:
        return <RectangularSelection data={data} category={category} />;
      default:
        return <React.Fragment />;
    }
  } else {
    return <React.Fragment />;
  }
};
