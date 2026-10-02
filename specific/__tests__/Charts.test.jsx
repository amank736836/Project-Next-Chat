import { act, cleanup, render } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { Doughnut, Line } from "react-chartjs-2";
import { DoughnutChart, LineChart } from "../Charts";
import { mockMotionPreference } from "../../components/animations/__tests__/motionTestUtils";

vi.mock("react-chartjs-2", () => ({
  Line: vi.fn(() => <canvas />),
  Doughnut: vi.fn(() => <canvas />),
}));

beforeEach(() => vi.clearAllMocks());
afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

describe("admin chart motion", () => {
  it("animates both charts normally and disables Chart.js animation on preference changes", () => {
    const preference = mockMotionPreference(false);
    render(
      <>
        <LineChart value={[1, 2, 3]} />
        <DoughnutChart
          labels={["Single Chats", "Group Chats"]}
          value={[12, 3]}
        />
      </>,
    );
    expect(vi.mocked(Line).mock.lastCall[0].options.animation.duration).toBe(
      900,
    );
    expect(
      vi.mocked(Doughnut).mock.lastCall[0].options.animation.animateScale,
    ).toBe(true);
    act(() => preference.setReduced(true));
    expect(vi.mocked(Line).mock.lastCall[0].options.animation).toBe(false);
    expect(vi.mocked(Doughnut).mock.lastCall[0].options.animation).toBe(false);
  });
});
