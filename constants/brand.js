/** Login-derived visual tokens. Used by MUI, CSS, SVG, and charts. */
export const brand = Object.freeze({
  primary: "#44775b",
  primaryRgb: "68, 119, 91",
  primaryHover: "#356448",
  sage: "#6b9278",
  ink: "#253d35",
  muted: "#667267",
  canvas: "#fafbf7",
  surface: "#ffffff",
  soft: "#edf4ed",
  field: "#fcfdfb",
  border: "#e1e6da",
  focus: "#559d79",
  mint: "#dfeddd",
  mintStrong: "#b8d4bd",
  warm: "#956b42",
  disabled: "#899585",
  darkSurface: "#253d35",
  onDark: "#edf4ed",
  font: "'DM Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
  controlRadius: "7px",
  cardRadius: "19px",
});

// Keep CSS and JS values in sync without maintaining a second palette.
export const brandCssVariables = Object.fromEntries(
  Object.entries(brand).map(([key, value]) => [
    `--champ-${key.replace(/[A-Z]/g, (letter) => `-${letter.toLowerCase()}`)}`,
    value,
  ]),
);
