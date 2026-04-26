"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSelector } from "react-redux";

export default function AdminProtectedRoute({ children }) {
  const { isAdmin, loader } = useSelector((state) => state.auth);
  const router = useRouter();

  useEffect(() => {
    if (!loader && !isAdmin) {
      router.push("/admin/login");
    }
  }, [isAdmin, loader, router]);

  if (loader || !isAdmin) {
    return null;
  }

  return children;
}
