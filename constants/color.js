import { brand } from "./brand";

// Compatibility exports for existing components; all resolve to the login palette.
export const gradientBg = `linear-gradient(145deg, ${brand.canvas}, ${brand.soft})`;
export const dialogBg = brand.surface;
export const authBg = brand.canvas;
export const orange = brand.warm;
export const lightOrange = `${brand.warm}22`;
export const purple = brand.primary;
export const lightPurple = `${brand.primary}22`;
export const grayColor = brand.canvas;
export const lightBlue = brand.primary;
export const matBlack = brand.ink;
