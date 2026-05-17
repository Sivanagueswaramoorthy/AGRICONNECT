"use client";

import Link from "next/link";
import { signIn, signOut, useSession } from "next-auth/react";
import { Sprout, ShoppingCart, User as UserIcon, LogOut } from "lucide-react";
import styles from "./Navbar.module.css";

export default function Navbar() {
  const { data: session } = useSession();

  return (
    <nav className={styles.navbar}>
      <div className={styles.container}>
        <Link href="/" className={styles.logo}>
          <Sprout className={styles.logoIcon} />
          <span>AgriConnect</span>
        </Link>

        <div className={styles.navLinks}>
          <Link href="/marketplace" className={styles.link}>Marketplace</Link>
          <Link href="/farmers" className={styles.link}>Our Farmers</Link>
          <Link href="/about" className={styles.link}>About Us</Link>
        </div>

        <div className={styles.actions}>
          {session ? (
            <>
              <Link href="/dashboard" className={styles.actionBtn}>
                <UserIcon size={20} />
                <span>Dashboard</span>
              </Link>
              <Link href="/cart" className={styles.actionBtn}>
                <ShoppingCart size={20} />
              </Link>
              <button onClick={() => signOut()} className={`${styles.actionBtn} ${styles.logoutBtn}`}>
                <LogOut size={20} />
              </button>
            </>
          ) : (
            <Link href="/" className="btn-primary">
              Sign In
            </Link>
          )}
        </div>
      </div>
    </nav>
  );
}
