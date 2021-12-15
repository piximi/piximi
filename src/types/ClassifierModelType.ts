export enum ModelType {
  SimpleCNN,
  UserUploaded,
}

type ModelProps = {
  modelName: string;
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
];
