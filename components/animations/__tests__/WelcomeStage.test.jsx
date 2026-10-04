import {
  cleanup,
  fireEvent,
  render,
  screen,
  within,
} from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import WelcomeStage from "../WelcomeStage";

afterEach(cleanup);

function renderStage() {
  const onCreateAccount = vi.fn();
  render(
    <WelcomeStage onCreateAccount={onCreateAccount}>
      <p>Account form</p>
    </WelcomeStage>,
  );
  return onCreateAccount;
}

describe("Chat Champ welcome stage", () => {
  it("renders the account form with accessible navigation and legal links", () => {
    renderStage();
    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent(
      "Good conversations.",
    );
    expect(screen.getByText("Account form")).toBeVisible();
    expect(screen.getByRole("link", { name: "Privacy" })).toHaveAttribute(
      "href",
      "/privacy",
    );
    expect(screen.getByRole("link", { name: "Terms" })).toHaveAttribute(
      "href",
      "/terms",
    );
  });

  it("opens the walkthrough and connects its call to action to sign-up", () => {
    const createAccount = renderStage();
    fireEvent.click(screen.getByRole("button", { name: /How it works/ }));
    const dialog = screen.getByRole("dialog");
    expect(within(dialog).getByRole("heading")).toHaveTextContent(
      "A hello is all it takes.",
    );
    expect(within(dialog).getAllByRole("listitem")).toHaveLength(3);
    fireEvent.click(
      within(dialog).getByRole("button", { name: /Create your account/ }),
    );
    expect(createAccount).toHaveBeenCalledOnce();
  });

  it("shows relevant details for every feature", () => {
    renderStage();
    fireEvent.click(
      screen.getByRole("button", { name: /Your people, together/ }),
    );
    expect(
      within(screen.getByRole("dialog")).getByRole("heading"),
    ).toHaveTextContent("Your people, together");
    expect(screen.getByText(/Create a group, add your friends/)).toBeVisible();
  });

  it("connects the header action to the existing account flow", () => {
    const createAccount = renderStage();
    fireEvent.click(
      screen.getByRole("button", { name: /Join the conversation/ }),
    );
    expect(createAccount).toHaveBeenCalledOnce();
  });
});
