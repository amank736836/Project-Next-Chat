"use client";

import AuthShell from "../../../components/animations/AuthShell";
import VerifyContent from "./VerifyContent";

export default function Verify() {
  return (
    <AuthShell maxTilt={6}>
      <VerifyContent />
    </AuthShell>
  );
}
