import { act, cleanup, render } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { animate } from "framer-motion";
import { AdminReveal, AnimatedCounter } from "../AdminMotion";
import { mockMotionPreference } from "./motionTestUtils";

vi.mock("framer-motion", async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...actual,
    animate: vi.fn((value, target) => {
      value.set(target);
      return { stop: vi.fn() };
    }),
  };
});

beforeEach(() => {
  mockMotionPreference();
  vi.mocked(animate).mockClear();
});
afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

describe("admin surface entrances", () => {
  it("starts a normal-motion entrance offset and transparent", () => {
    mockMotionPreference(false);
    const { container } = render(
      <AdminReveal delay={0.2}>Dashboard card</AdminReveal>,
    );
    expect(container.firstChild).toHaveStyle({
      opacity: "0",
      transform: "translateY(16px)",
    });
  });

  it("shows the content immediately for reduced motion", () => {
    const { container } = render(
      <AdminReveal delay={2} lift>
        Dashboard card
      </AdminReveal>,
    );
    expect(container.firstChild).toHaveStyle({ opacity: "1" });
    expect(container.firstChild.style.transform).not.toContain("16px");
  });
});

describe("animated admin counters", () => {
  it("shows the final formatted number without animating in reduced motion", () => {
    const { container, rerender } = render(<AnimatedCounter value={1234} />);
    const counter = container.querySelector("[data-admin-counter]");
    expect(counter.querySelector("[aria-hidden]")).toHaveTextContent("1,234");
    expect(counter.firstChild).toHaveTextContent("1,234");
    expect(counter.firstChild).not.toHaveAttribute("aria-hidden");
    expect(animate).not.toHaveBeenCalled();

    rerender(<AnimatedCounter value={2500} />);
    expect(counter.querySelector("[aria-hidden]")).toHaveTextContent("2,500");
  });

  it("stops obsolete animations on value changes and unmount", () => {
    mockMotionPreference(false);
    const { rerender, unmount } = render(<AnimatedCounter value={120} />);
    expect(animate).toHaveBeenLastCalledWith(
      expect.anything(),
      120,
      expect.objectContaining({ duration: 0.9 }),
    );
    const firstAnimation = vi.mocked(animate).mock.results[0].value;

    rerender(<AnimatedCounter value={400} />);
    expect(firstAnimation.stop).toHaveBeenCalledOnce();
    expect(animate).toHaveBeenLastCalledWith(
      expect.anything(),
      400,
      expect.anything(),
    );
    const nextAnimation = vi.mocked(animate).mock.results.at(-1).value;
    unmount();
    expect(nextAnimation.stop).toHaveBeenCalledOnce();
  });

  it("stops counting if the preference changes during the session", () => {
    const preference = mockMotionPreference(false);
    const { container } = render(<AnimatedCounter value={1000} />);
    const animation = vi.mocked(animate).mock.results[0].value;
    act(() => preference.setReduced(true));
    expect(animation.stop).toHaveBeenCalledOnce();
    expect(container.querySelector("[aria-hidden]")).toHaveTextContent("1,000");
  });

  it.each([NaN, Infinity, -5])("normalises invalid count %s", (value) => {
    const { container } = render(<AnimatedCounter value={value} />);
    expect(container.querySelector("[aria-hidden]")).toHaveTextContent("0");
  });
});
