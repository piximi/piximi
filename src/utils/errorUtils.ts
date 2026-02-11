export const parseError = (error: any) => {
  return error instanceof Error ? error : new Error(String(error));
};
