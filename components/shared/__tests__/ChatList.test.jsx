import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import ChatList from "../ChatList";

vi.mock("../AvatarCard", () => ({ default: () => <span /> }));
afterEach(cleanup);
const chats = [
  { _id: "alice", name: "Alice", groupChat: false },
  { _id: "design", name: "Design team", groupChat: true },
];

describe("workspace conversation list", () => {
  it("filters conversations by type and name without changing selection", () => {
    render(<ChatList chats={chats} chatId="alice" />);
    expect(screen.getByRole("link", { name: /Alice/ })).toHaveAttribute(
      "aria-current",
      "page",
    );
    fireEvent.click(
      screen.getByRole("button", { name: "Groups", exact: true }),
    );
    expect(
      screen.queryByRole("link", { name: /Alice/ }),
    ).not.toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: /Design team/ }),
    ).toBeInTheDocument();
    fireEvent.change(
      screen.getByRole("textbox", { name: "Find a conversation" }),
      { target: { value: "not found" } },
    );
    expect(screen.getByText("No conversations found")).toBeInTheDocument();
    fireEvent.change(screen.getByRole("textbox"), {
      target: { value: "design" },
    });
    expect(screen.getByRole("link", { name: /Design team/ })).toHaveAttribute(
      "href",
      "/chat/design",
    );
  });

  it("searches beyond the initial render window", () => {
    const manyChats = Array.from({ length: 65 }, (_, i) => ({
      _id: String(i),
      name: `Person ${i}`,
    }));
    render(<ChatList chats={manyChats} />);
    expect(screen.getAllByRole("link")).toHaveLength(40);
    fireEvent.change(screen.getByRole("textbox"), {
      target: { value: "Person 64" },
    });
    expect(screen.getByRole("link", { name: /Person 64/ })).toBeInTheDocument();
  });

  it("keeps deletion accessible and separate from navigation", () => {
    const handleDeleteChat = vi.fn();
    const onSelectChat = vi.fn();
    render(
      <ChatList
        chats={chats}
        handleDeleteChat={handleDeleteChat}
        onSelectChat={onSelectChat}
      />,
    );
    const button = screen.getByRole("button", { name: "Delete chat: Alice" });
    expect(button.closest("a")).toBeNull();
    fireEvent.click(button);
    expect(handleDeleteChat).toHaveBeenCalledWith(
      expect.anything(),
      "alice",
      false,
    );
    expect(onSelectChat).not.toHaveBeenCalled();
  });

  it("provides a useful empty inbox state", () => {
    render(<ChatList />);
    expect(screen.getByText("Your inbox starts here")).toBeInTheDocument();
  });
});
