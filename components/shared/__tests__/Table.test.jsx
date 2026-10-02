import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
} from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import Table from "../Table";
import { mockMotionPreference } from "../../animations/__tests__/motionTestUtils";

vi.mock("@mui/x-data-grid", () => ({
  DataGrid: (props) => (
    <div
      role="grid"
      className={props.className}
      aria-label={props["aria-label"]}
    >
      <button onClick={props.onPaginationModelChange}>Next page</button>
      <button onClick={props.onSortModelChange}>Sort</button>
      <button onClick={props.onFilterModelChange}>Filter</button>
      {props.rows.map((row, index) => (
        <div
          key={row.id}
          className={props.getRowClassName({
            indexRelativeToCurrentPage: index,
          })}
        >
          {row.name}
        </div>
      ))}
    </div>
  ),
}));

const rows = Array.from({ length: 10 }, (_, index) => ({
  id: index,
  name: `User ${index}`,
}));
beforeEach(() => {
  mockMotionPreference(false);
  vi.useFakeTimers();
});
afterEach(() => {
  cleanup();
  vi.useRealTimers();
  vi.unstubAllGlobals();
});

describe("virtualised table motion", () => {
  it("caps staggering and stops row entrances after the brief initial window", () => {
    render(<Table headings="All Users" rows={rows} columns={[]} />);
    expect(screen.getByRole("grid")).toHaveClass("admin-table-entering");
    expect(screen.getByText("User 9")).toHaveClass("admin-row-7");
    act(() => vi.advanceTimersByTime(700));
    expect(screen.getByRole("grid")).not.toHaveClass("admin-table-entering");
  });

  it.each(["Next page", "Sort", "Filter"])(
    "briefly replays rows after %s without replacing the grid",
    (name) => {
      render(<Table headings="All Users" rows={rows} columns={[]} />);
      const grid = screen.getByRole("grid");
      act(() => vi.advanceTimersByTime(700));
      fireEvent.click(screen.getByRole("button", { name }));
      expect(screen.getByRole("grid")).toBe(grid);
      expect(grid).toHaveClass("admin-table-entering");
      act(() => vi.advanceTimersByTime(700));
      expect(grid).not.toHaveClass("admin-table-entering");
    },
  );

  it("never starts row animations when reduced motion is requested", () => {
    mockMotionPreference(true);
    render(<Table headings="All Users" rows={rows} columns={[]} />);
    expect(screen.getByRole("grid")).not.toHaveClass("admin-table-entering");
    fireEvent.click(screen.getByRole("button", { name: "Next page" }));
    expect(screen.getByRole("grid")).not.toHaveClass("admin-table-entering");
  });
});
