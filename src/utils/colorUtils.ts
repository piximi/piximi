export const getRandomColor = () => {
  const letters = "0123456789ABCDEF";
  let color = "#";
  for (let i = 0; i < 6; i++) {
    color += letters[Math.floor(Math.random() * 16)];
  }
  return color;
};

const componentToHex = (c: number) => {
  const hex = (c * 255).toString(16);
  return hex.length === 1 ? "0" + hex : hex;
};

export const rgbToHex = (rgb: [number, number, number]) => {
  return (
    "#" +
    componentToHex(rgb[0]) +
    componentToHex(rgb[1]) +
    componentToHex(rgb[2])
  );
};
