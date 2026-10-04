"use client";

import { useState } from "react";
import AuthShell from "../../../components/animations/AuthShell";
import LoginContent from "./LoginContent";

export default function Login() {
  const [isLogin, setIsLogin] = useState(true);
  return (
    <AuthShell layout="welcome" onCreateAccount={() => setIsLogin(false)}>
      <LoginContent isLogin={isLogin} setIsLogin={setIsLogin} />
    </AuthShell>
  );
}
