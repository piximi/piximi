export const modelInfo: Record<
  string,
  {
    name: string;
    description: string;
    use: string;
    output: { name: string; url?: string };
    sources: Array<{ text: string; url: string }>;
    cite?: Array<{ text: string; url: string }>;
  }
> = {
  StardistVHE: {
    name: "Stardist (Versatile) H&E Nuclei Segmentation",
    description:
      "Object detection / instance segmentation with star-convex shapes",
    use: "Segment individual cell nuclei from brightfield images with H&E staining",
    output: { name: "stardist_nucleus" },
    sources: [
      {
        text: "Zenodo",
        url: "https://zenodo.org/record/6338615",
      },
      {
        text: "BioImage",
        url: "https://bioimage.io/#/?tags=stardist&id=10.5281%2Fzenodo.6338614&type=model",
      },
      {
        text: "GitHub",
        url: "https://github.com/stardist/stardist/blob/master/README.md#pretrained-models-for-2d",
      },
    ],
    cite: [
      {
        text: "Cell Detection with Star-Convex Polygons",
        url: "https://doi.org/10.1007/978-3-030-00934-2_30",
      },
      {
        text: "Star-convex Polyhedra for 3D Object Detection and Segmentation in Microscopy",
        url: "https://doi.org/10.1109/WACV45572.2020.9093435",
      },
    ],
  },
  StardistFluo: {
    name: "Stardist (Versatile) Fluorescence Nuclei Segmentation",
    description:
      "Object detection / instance segmentation with star-convex shapes",
    use: "Segment individual cell nuclei from single channel fluorescence data (2018 DSB)",
    output: { name: "stardist_nucleus" },
    sources: [
      {
        text: "Zenodo",
        url: "https://zenodo.org/records/6348085",
      },
      {
        text: "BioImage",
        url: "https://bioimage.io/#/?tags=stardist&id=10.5281%2Fzenodo.6348084",
      },
      {
        text: "GitHub",
        url: "https://github.com/stardist/stardist/blob/master/README.md#pretrained-models-for-2d",
      },
    ],
    cite: [
      {
        text: "Cell Detection with Star-Convex Polygons",
        url: "https://doi.org/10.1007/978-3-030-00934-2_30",
      },
      {
        text: "Star-convex Polyhedra for 3D Object Detection and Segmentation in Microscopy",
        url: "https://doi.org/10.1109/WACV45572.2020.9093435",
      },
    ],
  },
  "COCO-SSD": {
    name: "COCO_SSD with MobileNet (v2) Backbone",
    description:
      "Object detection model that aims to localize and identify multiple objects in a single image",
    use: "Detects objects defined in the COCO dataset, which is a large-scale object detection, segmentation, and captioning dataset",
    output: {
      name: "Output Classes",
      url: "https://github.com/tensorflow/tfjs-models/blob/master/coco-ssd/src/classes.ts",
    },
    sources: [
      {
        text: "Kaggle",
        url: "https://www.kaggle.com/models/tensorflow/ssd-mobilenet-v2/tensorFlow2/ssd-mobilenet-v2/",
      },
      {
        text: "GitHub",
        url: "https://github.com/tensorflow/tfjs-models/tree/master/coco-ssd",
      },
    ],
  },
  Cellpose: {
    name: "Cellpose",
    description: "A generalist algorithm for cell and nucleus segmentation",
    use: "Segment general cells",
    output: { name: "cellpose_cells" },
    sources: [
      {
        text: "GitHub",
        url: "https://github.com/mouseland/cellpose",
      },
    ],
    cite: [
      {
        text: "Cellpose: a generalist algorithm for cellular segmentation",
        url: "https://www.nature.com/articles/s41592-020-01018-x",
      },
      {
        text: "Cellpose 2.0: how to train your own model",
        url: "https://www.nature.com/articles/s41592-022-01663-4",
      },
    ],
  },
  GlandSegmentation: {
    name: "Gland Segmentation",
    description:
      "Gland segmentation task with GlaS 2015 dataset using UNet model",
    use: "Trained on images of Hematoxylin and Eosin (H&E) stained slides, consisting of a variety of histologic grades",
    output: { name: "glas_glands" },
    sources: [
      {
        text: "Kaggle",
        url: "https://www.kaggle.com/datasets/sani84/glasmiccai2015-gland-segmentation",
      },
    ],
    cite: [
      {
        text: "Gland segmentation in colon histology images: The glas challenge contest",
        url: "https://pubmed.ncbi.nlm.nih.gov/27614792/",
      },
    ],
  },
};
