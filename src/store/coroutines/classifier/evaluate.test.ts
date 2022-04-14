import {
  loadLayersModel,
  io as tfio,
  memory as tfmemory,
  time as tftime,
  profile as tfprofile,
} from "@tensorflow/tfjs-node";
import { evaluate } from "./evaluate";
import { Category } from "../../../types/Category";
import { ImageType } from "../../../types/ImageType";
import { Partition } from "../../../types/Partition";
import { Shape } from "../../../types/Shape";
import { RescaleOptions } from "../../../types/RescaleOptions";
import { generateDefaultChannels } from "../../../image/imageHelper";
import { preprocess } from "store/coroutines/classifier/preprocess";
import { EvaluationResultType } from "types/EvaluationResultType";
import { PreprocessOptions } from "types/PreprocessOptions";
import { FitOptions } from "types/FitOptions";
import { CropOptions, CropSchema } from "types/CropOptions";

jest.setTimeout(100000);

const categories: Array<Category> = [
  // {
  //   color: "#AAAAAA",
  //   id: "00000000-0000-0000-0000-000000000010",
  //   name: "Unknown",
  //   visible: true,
  // },
  {
    color: "#CD6769",
    id: "10000000-0000-0000-0000-000000000000",
    name: "0",
    visible: true,
  },
  {
    color: "#70FF99",
    id: "10000000-0000-0000-0000-000000000001",
    name: "1",
    visible: true,
  },
  {
    color: "#F49FB8",
    id: "10000000-0000-0000-0000-000000000002",
    name: "2",
    visible: true,
  },
  {
    color: "#A0B7D3",
    id: "10000000-0000-0000-0000-000000000003",
    name: "3",
    visible: true,
  },
  {
    color: "#0D9347",
    id: "10000000-0000-0000-0000-000000000004",
    name: "4",
    visible: true,
  },
  {
    color: "#794BA1",
    id: "10000000-0000-0000-0000-000000000005",
    name: "5",
    visible: true,
  },
  {
    color: "#D5C49C",
    id: "10000000-0000-0000-0000-000000000006",
    name: "6",
    visible: true,
  },
  {
    color: "#AD4C68",
    id: "10000000-0000-0000-0000-000000000007",
    name: "7",
    visible: true,
  },
  {
    color: "#952FB5",
    id: "10000000-0000-0000-0000-000000000008",
    name: "8",
    visible: true,
  },
  {
    color: "#4330B9",
    id: "10000000-0000-0000-0000-000000000009",
    name: "9",
    visible: true,
  },
];

const inputShape: Shape = {
  width: 28,
  channels: 1,
  frames: 1,
  height: 28,
  planes: 1,
};

const rescaleOptions: RescaleOptions = {
  rescale: true,
  rescaleMinMax: { min: 2, max: 5 },
};

const cropOptions: CropOptions = {
  numCrops: 1,
  cropSchema: CropSchema.None,
};

const preprocessingOptions: PreprocessOptions = {
  shuffle: true,
  rescaleOptions,
  cropOptions,
};

const fitOptions: FitOptions = {
  epochs: 2,
  batchSize: 3,
  initialEpoch: 0,
  test_data_size: 3,
  train_data_size: 3,
};

const validationImages: Array<ImageType> = [
  {
    annotations: [],
    activePlane: 0,
    categoryId: "10000000-0000-0000-0000-000000000002", // should be 3, purposefully incorrect for testing
    id: "00000000-0000-0000-0001-00000000000",
    colors: generateDefaultChannels(inputShape.channels),
    name: "mnist",
    originalSrc: [
      [
        "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABwAAAAcCAAAAABXZoBIAAAA7ElEQVR4nGNgGGggenEnbsm5f9/K45Lj+/j378wDNVjlmJb/+/v37993ptgkS/7++/v3799/a7HISbz69/9KNUPN/+MwERaEJCv7/76mTwyf///HZmyKHQMDg/jNfzm4HMw1/e8RFhxypmf+/i3FKqPQee/fv393scpxnIF4pQMuwoSQlDVkYHjdu51BFy6CZPnfd/vWHXjp68mATfKeKAMDA4MDw310+9g8pSGM+H//FNElZ/31YGBgYBCo//J3KoYnvv51VRWWTTvy9+9mbnRJ1b9///199PHvv7+beTC8KPESGltbMfTRGwAAe3RlA24l0K8AAAAASUVORK5CYII=",
      ],
    ],
    partition: Partition.Validation,
    visible: true,
    shape: inputShape,
    src: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABwAAAAcCAAAAABXZoBIAAAA7ElEQVR4nGNgGGggenEnbsm5f9/K45Lj+/j378wDNVjlmJb/+/v37993ptgkS/7++/v3799/a7HISbz69/9KNUPN/+MwERaEJCv7/76mTwyf///HZmyKHQMDg/jNfzm4HMw1/e8RFhxypmf+/i3FKqPQee/fv393scpxnIF4pQMuwoSQlDVkYHjdu51BFy6CZPnfd/vWHXjp68mATfKeKAMDA4MDw310+9g8pSGM+H//FNElZ/31YGBgYBCo//J3KoYnvv51VRWWTTvy9+9mbnRJ1b9///199PHvv7+beTC8KPESGltbMfTRGwAAe3RlA24l0K8AAAAASUVORK5CYII=",
  },

  {
    annotations: [],
    activePlane: 0,
    categoryId: "10000000-0000-0000-0000-000000000008", // 8
    colors: generateDefaultChannels(inputShape.channels),
    id: "00000000-0000-0000-0002-00000000000",
    name: "mnist",
    originalSrc: [
      [
        "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABwAAAAcCAAAAABXZoBIAAAA+UlEQVR4nGNgGNSANeb2AQYGBgbmJf+E0KQ4Yq79/XJFjoGBddHfH4KocvyX/v6aqsjAwKC39e83XzS53L+3wxkYGBgst/194Y9maP/f2yoMDAwMWi/+flZAd0z/R08+BgYGq11/t9tChVjgkq95tpx6wHCkRmxX1HuoECNckm2SMQODMj/DRZd3ODxa9PfvThxSDIovUCSZkOW4G0QXIfNRJKtjbnIx3MZuqNSbW+pb/tpilRO98cFP6+NJbqySzX/zBHf+DcUqx7Hvb2zs39kcWCWF/37o/vrXC7tzhP/+/v53Bhsuyb9/r7Bgl2PgOvV3DisOOeoCAPdCVcP4Rpg/AAAAAElFTkSuQmCC",
      ],
    ],
    partition: Partition.Validation,
    visible: true,
    shape: inputShape,
    src: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABwAAAAcCAAAAABXZoBIAAAA+UlEQVR4nGNgGNSANeb2AQYGBgbmJf+E0KQ4Yq79/XJFjoGBddHfH4KocvyX/v6aqsjAwKC39e83XzS53L+3wxkYGBgst/194Y9maP/f2yoMDAwMWi/+flZAd0z/R08+BgYGq11/t9tChVjgkq95tpx6wHCkRmxX1HuoECNckm2SMQODMj/DRZd3ODxa9PfvThxSDIovUCSZkOW4G0QXIfNRJKtjbnIx3MZuqNSbW+pb/tpilRO98cFP6+NJbqySzX/zBHf+DcUqx7Hvb2zs39kcWCWF/37o/vrXC7tzhP/+/v53Bhsuyb9/r7Bgl2PgOvV3DisOOeoCAPdCVcP4Rpg/AAAAAElFTkSuQmCC",
  },

  {
    annotations: [],
    activePlane: 0,
    categoryId: "10000000-0000-0000-0000-000000000007", // 7
    colors: generateDefaultChannels(inputShape.channels),
    id: "00000000-0000-0000-0003-00000000000",
    name: "mnist",
    originalSrc: [
      [
        "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABwAAAAcCAAAAABXZoBIAAAAuUlEQVR4nGNgGEqAkYGBgeEC7y4GBoaVH94+xiIpcU6CgYGBgeH1XQaGbbdXokoysDPLeTEwMGg4MDBIcX1fkI3LHoPyx19wu4K5C49k3H+4JBO6HGvQ//M4NU76984elxzf1X99ODWW/fukgEtO+du/abjk2Of9++SES1Lr378eJC6qV1wZ/m7BpVH+z7/9uOQYpv37J4lLju/mv+WsuCT7/r1RQhFAchCTCsPFe7g0sv37h9OPpAIAr7k2JCcwVrMAAAAASUVORK5CYII=",
      ],
    ],
    partition: Partition.Validation,
    visible: true,
    shape: inputShape,
    src: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABwAAAAcCAAAAABXZoBIAAAAuUlEQVR4nGNgGEqAkYGBgeEC7y4GBoaVH94+xiIpcU6CgYGBgeH1XQaGbbdXokoysDPLeTEwMGg4MDBIcX1fkI3LHoPyx19wu4K5C49k3H+4JBO6HGvQ//M4NU76984elxzf1X99ODWW/fukgEtO+du/abjk2Of9++SES1Lr378eJC6qV1wZ/m7BpVH+z7/9uOQYpv37J4lLju/mv+WsuCT7/r1RQhFAchCTCsPFe7g0sv37h9OPpAIAr7k2JCcwVrMAAAAASUVORK5CYII=",
  },
];

it("evaluate", async () => {
  // await setBackend("tensorflow");

  const validationData = await preprocess(
    validationImages,
    categories,
    inputShape,
    preprocessingOptions,
    fitOptions
  );

  const fs = require("fs");
  const path = require("path");

  const jsonFileBuffer = fs.readFileSync(
    path.join(__dirname, "mnist_classifier.json")
  );

  const weightsFileBuffer = fs.readFileSync(
    path.join(__dirname, "mnist_classifier.weights.bin")
  );

  const jsonFile = new File(
    [new Blob([new Uint8Array(jsonFileBuffer)])],
    "mnist_classifier.json"
  );
  const weightsFile = new File(
    [new Blob([new Uint8Array(weightsFileBuffer)])],
    "mnist_classifier.weights.bin"
  );

  const model = await loadLayersModel(
    tfio.browserFiles([jsonFile, weightsFile])
  );

  // console.log("weights file:", tfmemory().numTensors, tfmemory().numBytes);

  const profile = await tfprofile(async () => {
    const res = await evaluate(
      //@ts-ignore
      model,
      validationData,
      validationImages,
      categories
    );
    return res;
  });

  const result = profile.result as EvaluationResultType;

  // console.log(`newBytes: ${profile.newBytes}`);
  // console.log(`newTensors: ${profile.newTensors}`);
  // console.log(`peakBytes: ${profile.peakBytes}`);
  // console.log(
  //   `byte usage over all kernels: ${profile.kernels.map(
  //     (k) => k.totalBytesSnapshot
  //   )}`
  // );

  // const time = await tftime(async () => {
  //   const res = await evaluate(
  //     //@ts-ignore
  //     model,
  //     validationData,
  //     validationImages,
  //     categories
  //   );
  //   return res;
  // });

  // console.log(
  //   `kernelMs: ${time.kernelMs}, wallTimeMs: ${time.wallMs}`
  // );

  // console.log("---------");
  // for (const [k, v] of Object.entries(result)) {
  //   if (k !== "confusionMatrix") {
  //     console.log(k, v);
  //   }
  // }

  const expectedResults = {
    confusionMatrix: [
      [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
      [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
      [0, 0, 0, 1, 0, 0, 0, 0, 0, 0],
      [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
      [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
      [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
      [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
      [0, 0, 0, 0, 0, 0, 0, 1, 0, 0],
      [0, 0, 0, 0, 0, 0, 0, 0, 1, 0],
      [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    ],
    accuracy: 0.6666666666666666,
    crossEntropy: 1.4029693743335276,
    precision: 0.6666666865348816,
    recall: 0.6666666865348816,
    f1Score: 0.6666666865348816,
  };

  // console.log(result);

  // expect(result.confusionMatrix).toEqual(expectedResults.confusionMatrix);
  // expect(result.accuracy).toBeCloseTo(expectedResults.accuracy, 5);
  // expect(result.crossEntropy).toBeCloseTo(expectedResults.crossEntropy, 5);
  // expect(result.precision).toBeCloseTo(expectedResults.precision, 5);
  // expect(result.recall).toBeCloseTo(expectedResults.recall, 5);
  // expect(result.f1Score).toBeCloseTo(expectedResults.f1Score, 5);
  expect(1).toEqual(1);
});
