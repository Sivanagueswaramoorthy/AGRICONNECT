"use client";

import React, { useState, useEffect } from "react";
import { Download, X, Share } from "lucide-react";

export default function PWAInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [isIOS, setIsIOS] = useState(false);

  useEffect(() => {
    // 1. Detect if the PWA is already running in standalone mode (already installed)
    const isStandalone = window.matchMedia("(display-mode: standalone)").matches 
      || (window.navigator as any).standalone 
      || document.referrer.includes("android-app://");

    if (isStandalone) return;

    // 2. Detect iOS
    const userAgent = window.navigator.userAgent.toLowerCase();
    const ios = /iphone|ipad|ipod/.test(userAgent);
    setIsIOS(ios);

    // If iOS and not standalone, show iOS manual install instructions after 3 seconds
    if (ios) {
      const timer = setTimeout(() => {
        setIsVisible(true);
      }, 3000);
      return () => clearTimeout(timer);
    }

    // 3. Listen for Android/Chrome PWA install prompt
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setIsVisible(true);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    
    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === "accepted") {
      console.log("PWA install accepted by user");
    }
    setDeferredPrompt(null);
    setIsVisible(false);
  };

  if (!isVisible) return null;

  return (
    <div style={{
      position: "fixed",
      bottom: "20px",
      left: "50%",
      transform: "translateX(-50%)",
      width: "90%",
      maxWidth: "450px",
      background: "rgba(255, 255, 255, 0.95)",
      backdropFilter: "blur(12px)",
      border: "1px solid rgba(16, 185, 129, 0.2)",
      borderRadius: "16px",
      boxShadow: "0 10px 25px rgba(15, 23, 42, 0.15)",
      padding: "1.25rem",
      zIndex: 99999,
      display: "flex",
      flexDirection: "column",
      gap: "1rem",
      fontFamily: "'Inter', sans-serif",
      animation: "slideUp 0.4s ease-out forwards",
    }}>
      <style>{`
        @keyframes slideUp {
          from { transform: translate(-50%, 100px); opacity: 0; }
          to { transform: translate(-50%, 0); opacity: 1; }
        }
      `}</style>
      
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <div style={{ display: "flex", gap: "0.75rem", alignItems: "center" }}>
          <div style={{ width: "42px", height: "42px", background: "#10b981", borderRadius: "10px", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontWeight: 800, fontSize: "1.2rem" }}>
            🌱
          </div>
          <div>
            <h4 style={{ margin: 0, fontSize: "1rem", fontWeight: 800, color: "#0f172a" }}>Install AgriConnect App</h4>
            <p style={{ margin: "0.25rem 0 0 0", fontSize: "0.8rem", color: "#64748b" }}>Access direct farm deals with fast loading & offline support!</p>
          </div>
        </div>
        <button 
          onClick={() => setIsVisible(false)}
          style={{ background: "none", border: "none", color: "#94a3b8", cursor: "pointer", padding: "0.25rem" }}
        >
          <X size={18} />
        </button>
      </div>

      {isIOS ? (
        <div style={{ background: "#f8fafc", padding: "0.75rem 1rem", borderRadius: "10px", fontSize: "0.85rem", color: "#475569", lineHeight: 1.5, display: "flex", alignItems: "center", gap: "0.5rem" }}>
          <Share size={18} color="#2563eb" style={{ flexShrink: 0 }} />
          <span>Tap the <strong>Share</strong> icon below in Safari and select <strong>'Add to Home Screen'</strong> to install.</span>
        </div>
      ) : (
        <button 
          onClick={handleInstall}
          style={{
            background: "#10b981",
            color: "#fff",
            border: "none",
            borderRadius: "10px",
            padding: "0.75rem",
            fontWeight: 800,
            fontSize: "0.9rem",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "0.5rem",
            boxShadow: "0 4px 12px rgba(16, 185, 129, 0.2)",
            transition: "all 0.2s"
          }}
        >
          <Download size={16} /> Install App
        </button>
      )}
    </div>
  );
}
