export const baseStyle = (arr: string[]) => {
  // Prefix all the string in the array with
  // uno-layer-base:
  // then return a concat separated by space
  return arr.map((s) => `uno-layer-base:${s}`).join(" ");
};
