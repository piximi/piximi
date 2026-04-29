const ht = 1;
export const haloFilter = (c: string) =>
  `drop-shadow(0 ${ht}px 0 ${c}) drop-shadow(0 -${ht}px 0 ${c}) drop-shadow(${ht}px 0 0 ${c}) drop-shadow(-${ht}px 0 0 ${c})`;
