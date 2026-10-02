import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import AdminAsyncContent from "../AdminAsyncContent";
import { mockMotionPreference } from "../../animations/__tests__/motionTestUtils";

beforeEach(() => mockMotionPreference());
afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

describe("admin async content", () => {
  it("announces loading and reveals data after the request completes", async () => {
    const { rerender } = render(
      <AdminAsyncContent isLoading loadingLabel="Loading users…">
        <p>All Users</p>
      </AdminAsyncContent>,
    );
    expect(screen.getByRole("status")).toHaveAttribute("aria-busy", "true");
    expect(screen.getByText("Loading users…")).toBeInTheDocument();
    expect(screen.queryByText("All Users")).not.toBeInTheDocument();

    rerender(
      <AdminAsyncContent>
        <p>All Users</p>
      </AdminAsyncContent>,
    );
    expect(await screen.findByText("All Users")).toBeInTheDocument();
    await waitFor(() =>
      expect(screen.queryByRole("status")).not.toBeInTheDocument(),
    );
  });

  it("shows the API error and keeps retry usable", () => {
    const retry = vi.fn();
    render(
      <AdminAsyncContent
        error={{ data: { message: "Could not load messages" } }}
        onRetry={retry}
      />,
    );
    expect(screen.getByRole("alert")).toHaveTextContent(
      "Could not load messages",
    );
    fireEvent.click(screen.getByRole("button", { name: "Try again" }));
    expect(retry).toHaveBeenCalledOnce();
  });

  it("uses a safe fallback for network errors", () => {
    render(<AdminAsyncContent error={{ status: "FETCH_ERROR" }} />);
    expect(screen.getByRole("alert")).toHaveTextContent(
      "Something went wrong. Please try again.",
    );
  });
});
