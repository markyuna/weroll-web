export const SKATE_TYPES = ["inline", "quad", "ambos"] as const;
export type SkateType = (typeof SKATE_TYPES)[number];

export const SKATE_TYPE_LABELS: Record<string, string> = {
  inline: "Patines en línea",
  quad: "Patines de cuatro ruedas",
  ambos: "Ambos",
};
