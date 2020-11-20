import "jest";
import { flood } from "./flood";

test("flood", () => {
  const canvas = document.createElement("canvas") as HTMLCanvasElement;

  canvas.width = 100;
  canvas.height = 100;

  flood({ x: 0, y: 0, canvas: canvas, tolerance: 1 });

  const context = canvas.getContext("2d");

  const data = context!.getImageData(0, 0, 1, 1).data;

  expect(data[0]).toBe(0);
});
