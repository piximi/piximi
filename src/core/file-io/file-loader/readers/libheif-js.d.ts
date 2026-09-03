// libheif-js ships types only for its low-level emscripten bindings, not for the
// high-level HeifDecoder API exposed via the `wasm-bundle` entry point.
declare module "libheif-js/wasm-bundle" {
  interface HeifImageData {
    data: Uint8ClampedArray;
    width: number;
    height: number;
  }

  interface HeifImage {
    get_width(): number;
    get_height(): number;
    display(
      image: HeifImageData,
      callback: (displayData: HeifImageData | null) => void,
    ): void;
  }

  class HeifDecoder {
    decode(buffer: ArrayBuffer | Uint8Array): HeifImage[];
  }

  const libheif: { HeifDecoder: typeof HeifDecoder };
  export default libheif;
}
