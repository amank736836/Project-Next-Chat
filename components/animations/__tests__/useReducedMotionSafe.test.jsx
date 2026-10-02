import {
  act,
  cleanup,
  render,
  renderHook,
  screen,
} from "@testing-library/react";
import { renderToString } from "react-dom/server";
import { afterEach, describe, expect, it, vi } from "vitest";
import useReducedMotionSafe from "../useReducedMotionSafe";
import { mockMotionPreference } from "./motionTestUtils";

function Preference() {
  return <span>{String(useReducedMotionSafe())}</span>;
}

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

describe("hydration-safe reduced motion", () => {
  it("uses a stable server snapshot and updates after hydration without a mismatch", async () => {
    mockMotionPreference(true);
    const markup = renderToString(<Preference />);
    expect(markup).toContain("false");
    const container = document.createElement("div");
    container.innerHTML = markup;
    document.body.appendChild(container);
    const onRecoverableError = vi.fn();
    render(<Preference />, { container, hydrate: true, onRecoverableError });
    expect(await screen.findByText("true")).toBeInTheDocument();
    expect(onRecoverableError).not.toHaveBeenCalled();
  });

  it("subscribes to OS changes and removes its listener on unmount", () => {
    const preference = mockMotionPreference(false);
    const { result, unmount } = renderHook(useReducedMotionSafe);
    expect(result.current).toBe(false);
    act(() => preference.setReduced(true));
    expect(result.current).toBe(true);
    act(() => preference.setReduced(false));
    expect(result.current).toBe(false);
    unmount();
    expect(preference.media.removeEventListener).toHaveBeenCalledWith(
      "change",
      expect.any(Function),
    );
  });

  it("supports older MediaQueryList listeners", () => {
    const preference = mockMotionPreference(true);
    preference.media.addEventListener = undefined;
    const { result, unmount } = renderHook(useReducedMotionSafe);
    expect(result.current).toBe(true);
    expect(preference.media.addListener).toHaveBeenCalled();
    unmount();
    expect(preference.media.removeListener).toHaveBeenCalled();
  });

  it("works when matchMedia is unavailable", () => {
    vi.stubGlobal("matchMedia", undefined);
    const { result } = renderHook(useReducedMotionSafe);
    expect(result.current).toBe(false);
  });
});
