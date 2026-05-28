export const getVariant = (variants: string[]) => {
  const normalized = variants.map((v) => v.toLowerCase());
  if (normalized.includes("candidate")) {
    return "candidate";
  }
  return "internal";
};
