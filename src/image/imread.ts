export const imread = (src: string, canvas: HTMLCanvasElement) => {
  return new Promise((resolve) => {
    const image = new HTMLImageElement();

    image.onload = () => {
      const width = image.width;
      const height = image.height;

      canvas.width = width;
      canvas.height = height;

      const context = canvas.getContext("2d");

      context!.drawImage(image, 0, 0, width, height);

      const data = context!.getImageData(0, 0, width, height).data;

      resolve(data);
    };

    image.src = src;
  });
};
