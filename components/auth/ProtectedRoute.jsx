"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useSelector } from "react-redux";

export default function ProtectedRoute({ children }) {
  const { user, loader } = useSelector((state) => state.auth);
  const router = useRouter();
  const [hydrated, setHydrated] = useState(false);

  // A fast session response can arrive before a streamed route hydrates.
  // Match the server's empty protected shell on the first client render.
  useEffect(() => setHydrated(true), []);

  useEffect(() => {
    if (!loader && !user) {
      router.push("/login");
    }
  }, [user, loader, router]);

  if (!hydrated || loader || !user) {
    return null;
  }

  return children;
}
