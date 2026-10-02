"use client";

import AuthShell from "../../../components/animations/AuthShell";
import AdminForgotContent from "./AdminForgotContent";

export default function AdminForgot() {
  return (
    <AuthShell maxTilt={4} className="admin-motion-root">
      <AdminForgotContent />
    </AuthShell>
  );
}
