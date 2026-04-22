import { useState, useEffect, useRef } from "react";
import { checkUsernameAvailability } from "../lib/features";

export default function useUsernameCheck(initialUsername = "") {
  const [username, setUsername] = useState(initialUsername);
  const [isAvailable, setIsAvailable] = useState(null);
  const [isChecking, setIsChecking] = useState(false);
  const timerRef = useRef(null);

  useEffect(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }

    if (!username || username.length < 3) {
      setIsAvailable(null);
      return;
    }

    setIsChecking(true);
    timerRef.current = setTimeout(async () => {
      try {
        const available = await checkUsernameAvailability(username);
        setIsAvailable(available);
      } catch (error) {
        console.error("Username check failed:", error);
        setIsAvailable(null);
      } finally {
        setIsChecking(false);
      }
    }, 500);

    return () => {
      clearTimeout(timerRef.current);
    };
  }, [username]);

  return {
    username,
    setUsername,
    isAvailable,
    isChecking,
    isValid: username.length >= 3
  };
}