"use client";

import { MotionConfig } from "framer-motion";
import { usePathname } from "next/navigation";
import AdminProtectedRoute from "../../components/auth/AdminProtectedRoute";
import AdminLayout from "../../components/layout/AdminLayout";

export default function AdminPortalLayout({ children }) {
  const pathname = usePathname();
  const isAuthScreen =
    pathname === "/admin/login" || pathname === "/admin/forgot";

  return (
    <MotionConfig reducedMotion="user">
      {isAuthScreen ? (
        children
      ) : (
        <AdminProtectedRoute>
          <AdminLayout>{children}</AdminLayout>
        </AdminProtectedRoute>
      )}
    </MotionConfig>
  );
}
