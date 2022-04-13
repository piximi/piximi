export enum CropSchema {
  Smallest = "Smallest", // crop to match smallest square in training dataset
  Biggest = "Biggest", // crop the biggest square possible per sample
  Match = "Match", // match crop size to architecture input shape
  None = "None", // do not crop
}

export type CropOptions = {
  numCrops: number;
  cropSchema: CropSchema;
};
