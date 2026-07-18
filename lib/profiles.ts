export const SKATE_TYPES = ["inline", "quad", "ambos"] as const;
export type SkateType = (typeof SKATE_TYPES)[number];

export const SKATE_STYLES = [
  "fitness_distancia",
  "artistico_dance",
  "derby",
  "urbano_casual",
] as const;
export type SkateStyle = (typeof SKATE_STYLES)[number];
