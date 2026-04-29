export const haloFilter = (c: string, ht: number = 1) =>
  `drop-shadow(0 ${ht}px 0 ${c}) drop-shadow(0 -${ht}px 0 ${c}) drop-shadow(${ht}px 0 0 ${c}) drop-shadow(-${ht}px 0 0 ${c})`;
