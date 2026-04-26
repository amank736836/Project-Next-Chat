"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSelector } from "react-redux";

export default function ProtectedRoute({ children }) {
  const { user, loader } = useSelector((state) => state.auth);
  const router = useRouter();

  useEffect(() => {
    if (!loader && !user) {
      router.push("/login");
    }
  }, [user, loader, router]);

  if (loader || !user) {
    return null;
  }

  return children;
}
