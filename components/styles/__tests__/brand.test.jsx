import { describe, expect, it } from "vitest";
import { getContrastRatio } from "@mui/material/styles";
import { brand, brandCssVariables } from "../../../constants/brand";
import { workspaceTheme } from "../WorkspaceTheme";
import {
  WIDGET_DEFAULTS,
  sanitizeWidgetSettings,
} from "../../../lib/widgetConfig";
import { purple, orange } from "../../../constants/color";

describe("login-derived shared brand", () => {
  it("uses the same values for CSS, MUI, charts, and default widgets", () => {
    expect(brandCssVariables["--champ-primary"]).toBe(brand.primary);
    expect(brandCssVariables["--champ-canvas"]).toBe(brand.canvas);
    expect(workspaceTheme.palette.primary.main).toBe(brand.primary);
    expect(workspaceTheme.palette.background.default).toBe(brand.canvas);
    expect(workspaceTheme.typography.fontFamily).toBe(brand.font);
    expect(
      workspaceTheme.components.MuiButton.styleOverrides.root.borderRadius,
    ).toBe(brand.controlRadius);
    expect(WIDGET_DEFAULTS.themeColor).toBe(brand.primary);
    expect(WIDGET_DEFAULTS.textColor).toBe(brand.ink);
    expect(purple).toBe(brand.primary);
    expect(orange).toBe(brand.warm);
  });

  it("keeps regular text and white primary-button text at AA contrast", () => {
    expect(
      getContrastRatio(brand.primary, brand.surface),
    ).toBeGreaterThanOrEqual(4.5);
    expect(getContrastRatio(brand.ink, brand.canvas)).toBeGreaterThanOrEqual(
      4.5,
    );
    expect(getContrastRatio(brand.muted, brand.surface)).toBeGreaterThanOrEqual(
      4.5,
    );
  });

  it.each(["#4facfe", "#6c3ce0", "#ff0000"])(
    "preserves a saved widget color (%s) instead of rebranding user choices",
    (color) => {
      expect(sanitizeWidgetSettings({ themeColor: color }).themeColor).toBe(
        color,
      );
    },
  );
});
