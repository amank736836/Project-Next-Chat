"use client";

import AuthShell from "../../../components/animations/AuthShell";
import LoginContent from "./LoginContent";

export default function Login() {
  return (
    <AuthShell maxTilt={7}>
      <LoginContent />
    </AuthShell>
  );
}
