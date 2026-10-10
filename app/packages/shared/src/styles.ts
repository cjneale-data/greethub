/** Curated art-style presets. `prompt` is the global medium/style string restated verbatim in every image prompt. */
export const ART_STYLES = {
  watercolor: {
    label: "Soft watercolor",
    prompt:
      "Soft 2D watercolor and gouache illustration, classic children's picture book style, gentle hand-drawn ink outlines, warm inviting palette, soft diffuse lighting, whimsical cozy atmosphere. Cartoon characters with soft round proportions and oversized expressive eyes - not photorealistic, no realistic skin texture, no sharp photographic shadows.",
  },
  storybook_ink: {
    label: "Ink and wash",
    prompt:
      "Vintage storybook ink-and-wash illustration, confident pen linework with loose watercolor tints, cream paper texture, muted warm palette, gentle humor. Cartoon characters with expressive faces - not photorealistic, no realistic skin texture.",
  },
  paper_cut: {
    label: "Paper cut-out",
    prompt:
      "Layered paper cut-out collage illustration, flat shapes with soft drop shadows between layers, bright playful palette, subtle paper grain. Cartoon characters built from simple shapes - not photorealistic.",
  },
  bold_flat: {
    label: "Bold and flat",
    prompt:
      "Modern flat vector-style children's illustration, bold clean shapes, limited vivid palette, thick friendly outlines, minimal texture, cheerful and graphic. Cartoon characters - not photorealistic.",
  },
  crayon: {
    label: "Crayon and pencil",
    prompt:
      "Hand-drawn crayon and colored-pencil illustration on textured paper, wobbly joyful lines, saturated childlike colors, warm and homemade. Cartoon characters - not photorealistic.",
  },
  storybook_3d: {
    label: "Cozy 3D",
    prompt:
      "Soft cozy 3D-rendered animated-film look, rounded clay-like forms, warm cinematic lighting, shallow depth of field, gentle color grading. Stylized cartoon characters - not photorealistic, no realistic skin pores.",
  },
} as const;

export type ArtStyleId = keyof typeof ART_STYLES;
export const ART_STYLE_IDS = Object.keys(ART_STYLES) as [ArtStyleId, ...ArtStyleId[]];
