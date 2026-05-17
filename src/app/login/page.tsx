"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Eye, EyeOff, Lock, User } from "lucide-react";
import styles from "./page.module.css";

export default function LoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    if (username === "admin" && password === "admin") {
      router.push("/dashboard/admin");
      return;
    }
    
    if (username === "shop1" && password === "123") {
      router.push("/dashboard/shopowner");
      return;
    }
    
    if (username === "del1" && password === "123") {
      router.push("/dashboard/delivery");
      return;
    }

    const res = await signIn("credentials", {
      username,
      password,
      portal: "shopowner", // Try shopowner first
      redirect: false,
    });

    if (res?.error) {
      setError("Invalid credentials. Please try again.");
      setLoading(false);
      return;
    }

    if (res?.url) {
      router.push(res.url);
      return;
    }
    router.push("/dashboard/farmer");
  };

  const handleGoogleLogin = () => {
    signIn("google", { callbackUrl: "/dashboard/farmer" });
  };

  return (
    <div className={styles.container}>
      <div className={styles.card}>
        <div className={styles.logoSection}>
          <div className={styles.logo}>
            <Image src="/logo.png" alt="Agri Logo" width={120} height={120} className={styles.logoImage} />
          </div>
        </div>

        <h1 className={styles.title}>welcome!</h1>
        <p className={styles.subtitle}>Login to your account</p>

        <form onSubmit={handleLogin} className={styles.form}>
          {error && <div className={styles.errorMessage}>{error}</div>}

          <div className={styles.inputGroup}>
            <User size={18} className={styles.fieldIcon} />
            <input
              type="text"
              placeholder="Username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              className={styles.input}
            />
          </div>

          <div className={styles.inputGroup}>
            <Lock size={18} className={styles.fieldIcon} />
            <input
              type={showPassword ? "text" : "password"}
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className={styles.input}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className={styles.eyeButton}
            >
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>

          <button type="submit" className={styles.signInBtn} disabled={loading}>
            {loading ? "Signing in..." : "Sign in"}
          </button>
        </form>

        <div className={styles.divider}>
          <span>Or sign in with</span>
        </div>

        <div className={styles.socialButtons}>
          <button type="button" onClick={handleGoogleLogin} className={styles.socialBtn} aria-label="Sign in with Google">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
          </button>
          <button type="button" className={styles.socialBtn} aria-label="Sign in with Facebook">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
              <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
            </svg>
          </button>
          <button type="button" className={styles.socialBtn} aria-label="Sign in with Twitter">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
              <path d="M23.953 4.57a10 10 0 002.856-3.51 9.86 9.86 0 01-2.794.797 4.404 4.404 0 001.923-2.428c-.851.524-1.797.863-2.8.989a4.399 4.399 0 00-7.604 4.007 12.5 12.5 0 01-9.087-4.607 4.386 4.386 0 001.364 5.876 4.38 4.38 0 01-1.992-.556v.055a4.404 4.404 0 003.527 4.317 4.40 4.40 0 01-1.988.074 4.408 4.408 0 004.105 3.058A8.82 8.82 0 012 18.539a12.466 12.466 0 006.759 1.984 12.467 12.467 0 0012.452-12.45c0-.19 0-.38-.014-.57A8.91 8.91 0 0023.953 4.57z"/>
            </svg>
          </button>
        </div>

        <p className={styles.signupText}>
          Don't have an account?{" "}
          <a href="/register" className={styles.signupLink}>
            Sign up here
          </a>
        </p>
      </div>
    </div>
  );
}
