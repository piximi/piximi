export const getInnerElementWidth = (el: HTMLElement) => {
  const {
    width: _elWidth,
    paddingLeft: _elPl,
    paddingRight: _elPr,
  } = getComputedStyle(el);
  const _elWidthVal = +_elWidth.slice(0, -2);
  const _elPlVal = +_elPl.slice(0, -2);
  const _elPrVal = +_elPr.slice(0, -2);
  return _elWidthVal - _elPlVal - _elPrVal;
};
