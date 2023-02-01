export enum ModelType {
  SimpleCNN,
  MobileNet,
  SimpleFCNSegmenter,
  FCNSegmenter,
  UserUploaded,
}

type ModelProps = {
  modelName: string;
  requiredChannels?: number;
  modelType: ModelType;
};
export interface DefaultModelProps extends ModelProps {}

export interface UserUploadedModelProps extends ModelProps {
  src: string;
}

export type ClassifierModelProps = UserUploadedModelProps | DefaultModelProps;

// export type SegmenterModelProps = UserUploadedModelProps | DefaultModelProps;

export type SegmenterModelProps = {
  modelName: string;
  requiredChannels?: number;
  modelType: ModelType;
  src?: string;
  modelArch?: string
};

export const availableClassifierModels: ClassifierModelProps[] = [
  {
    modelName: "SimpleCNN",
    modelType: ModelType.SimpleCNN,
  },
  {
    modelName: "MobileNet",
    requiredChannels: 3,
    modelType: ModelType.MobileNet,
  },
];



export const availableSegmenterModels: SegmenterModelProps[] = [
  {
    modelName: "SimpleFCNSegmenter",
    modelType: ModelType.SimpleFCNSegmenter,
  },
  {
    modelName: "FCNSegmenter",
    modelType: ModelType.FCNSegmenter,
  },
];
