"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSelector } from "react-redux";

export default function AdminPage() {
  const { isAdmin, loader } = useSelector((state) => state.auth);
  const router = useRouter();

  useEffect(() => {
    if (!loader) {
      if (isAdmin) {
        router.push("/admin/dashboard");
      } else {
        router.push("/admin/login");
      }
    }
  }, [isAdmin, loader, router]);

  return null;
}
