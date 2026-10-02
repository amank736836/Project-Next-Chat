"use client";

import AuthShell from "../../../components/animations/AuthShell";
import ForgotContent from "./ForgotContent";

export default function Forgot() {
  return (
    <AuthShell maxTilt={6}>
      <ForgotContent />
    </AuthShell>
  );
}
