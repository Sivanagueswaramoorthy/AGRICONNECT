"use client";

import { SessionProvider } from "next-auth/react";
import { useEffect } from "react";

export default function Providers({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    if ("serviceWorker" in navigator) {
      window.addEventListener("load", () => {
        navigator.serviceWorker
          .register("/sw.js")
          .then((reg) => console.log("Service Worker registered successfully!", reg.scope))
          .catch((err) => console.error("Service Worker registration failed:", err));
      });
    }
  }, []);

  return <SessionProvider>{children}</SessionProvider>;
}
