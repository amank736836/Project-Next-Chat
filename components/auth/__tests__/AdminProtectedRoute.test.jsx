import { cleanup, render, screen, waitFor } from "@testing-library/react";
import { configureStore } from "@reduxjs/toolkit";
import { Provider } from "react-redux";
import axios from "axios";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import authSlice from "../../../redux/reducers/auth.reducer";
import AdminProtectedRoute from "../AdminProtectedRoute";
import { mockMotionPreference } from "../../animations/__tests__/motionTestUtils";

const { replace } = vi.hoisted(() => ({ replace: vi.fn() }));
vi.mock("next/navigation", () => ({ useRouter: () => ({ replace }) }));
vi.mock("axios", () => ({ default: { get: vi.fn() } }));
vi.mock("react-hot-toast", () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}));

function renderRoute() {
  const store = configureStore({ reducer: { auth: authSlice.reducer } });
  return render(
    <Provider store={store}>
      <AdminProtectedRoute>
        <p>Protected dashboard</p>
      </AdminProtectedRoute>
    </Provider>,
  );
}

beforeEach(() => {
  mockMotionPreference();
  vi.clearAllMocks();
});
afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

describe("admin session refresh", () => {
  it("rechecks the cookie before showing protected content on a hard refresh", async () => {
    vi.mocked(axios.get).mockResolvedValue({
      data: { admin: true, message: "Session verified" },
    });
    renderRoute();
    expect(screen.getByRole("status")).toHaveTextContent(
      "Checking admin session…",
    );
    expect(screen.queryByText("Protected dashboard")).not.toBeInTheDocument();
    expect(await screen.findByText("Protected dashboard")).toBeInTheDocument();
    expect(replace).not.toHaveBeenCalled();
  });

  it("redirects a rejected session without flashing protected content", async () => {
    vi.mocked(axios.get).mockRejectedValue({
      response: { data: { message: "Unauthorised" } },
    });
    renderRoute();
    await waitFor(() => expect(replace).toHaveBeenCalledWith("/admin/login"));
    expect(screen.queryByText("Protected dashboard")).not.toBeInTheDocument();
  });
});
