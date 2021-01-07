export function initializeKmeansCenters(
  image: Float32Array,
  edgeMap: Float32Array,
  centers: Float32Array,
  clusterParams: Float32Array,
  numRegionsX: number,
  numRegionsY: number,
  regionSize: number,
  imW: number,
  imH: number
) {
  let i = 0;
  let j = 0;

  let x;
  let y;

  for (let v = 0; v < numRegionsY; v++) {
    for (let u = 0; u < numRegionsX; u++) {
      let centerx = 0;
      let centery = 0;
      let minEdgeValue = Infinity;
      let xp;
      let yp;

      x = parseInt(String(Math.round(regionSize * (u + 0.5))), 10);
      y = parseInt(String(Math.round(regionSize * (v + 0.5))), 10);

      x = Math.max(Math.min(x, imW - 1), 0);
      y = Math.max(Math.min(y, imH - 1), 0);

      for (yp = Math.max(0, y - 1); yp <= Math.min(imH - 1, y + 1); yp++) {
        for (xp = Math.max(0, x - 1); xp <= Math.min(imW - 1, x + 1); xp++) {
          const thisEdgeValue = edgeMap[yp * imW + xp];

          if (thisEdgeValue < minEdgeValue) {
            minEdgeValue = thisEdgeValue;
            centerx = xp;
            centery = yp;
          }
        }
      }

      centers[i++] = parseFloat(String(centerx));
      centers[i++] = parseFloat(String(centery));

      centers[i++] = image[centery * imW + centerx];
      centers[i++] = image[imW * imH + centery * imW + centerx];
      centers[i++] = image[2 * imW * imH + centery * imW + centerx];

      clusterParams[j++] = 10 * 10;
      clusterParams[j++] = regionSize * regionSize;
    }
  }
}
