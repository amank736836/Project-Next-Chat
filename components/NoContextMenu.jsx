"use client";

export default function NoContextMenu({ children }) {
  return (
    <div onContextMenu={(e) => e.preventDefault()}>
      {children}
    </div>
  );
}
