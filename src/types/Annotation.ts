export type Annotation = {
  image: {
    checksum: string;
    pathname: string;
    shape: {
      r: number;
      c: number;
      channels: number;
    };
    objects: {
      bounding_box: {
        minimum: {
          r: number;
          c: number;
        };
        maximum: {
          r: number;
          c: number;
        };
      };
      category: string;
      mask: any; //modify later
    }[];
  };
};
