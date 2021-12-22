export enum ModelType {
  SimpleCNN,
  MobileNet,
  UserUploaded,
}

type ModelProps = {
  modelName: string;
  requiredChannels?: number;
  modelType: ModelType;
};

interface UserUploadedModelProps extends ModelProps {
  src: string;
}

interface DefaultModelProps extends ModelProps {}

export type ClassifierModelProps = UserUploadedModelProps | DefaultModelProps;

export const availableModels: ClassifierModelProps[] = [
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
