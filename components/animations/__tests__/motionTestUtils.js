import { vi } from "vitest";

export function mockMotionPreference(initial = true) {
  let reduced = initial;
  const listeners = new Set();
  const media = {
    get matches() {
      return reduced;
    },
    media: "(prefers-reduced-motion: reduce)",
    addEventListener: vi.fn((_, listener) => listeners.add(listener)),
    removeEventListener: vi.fn((_, listener) => listeners.delete(listener)),
    addListener: vi.fn((listener) => listeners.add(listener)),
    removeListener: vi.fn((listener) => listeners.delete(listener)),
  };

  vi.stubGlobal(
    "matchMedia",
    vi.fn((query) =>
      query === media.media
        ? media
        : {
            ...media,
            matches: false,
            media: query,
          },
    ),
  );

  return {
    media,
    setReduced(value) {
      reduced = value;
      listeners.forEach((listener) => listener({ matches: value }));
    },
  };
}
