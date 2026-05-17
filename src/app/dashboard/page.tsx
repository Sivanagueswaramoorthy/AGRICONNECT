"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import styles from "./farmer/page.module.css"; // Reuse styling for loading screen

export default function DashboardGateway() {
  const router = useRouter();
  const { data: session, status } = useSession();

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    } else if (status === "authenticated" && session?.user) {
      const role = (session.user as any).role;
      if (role === "ADMIN") {
        router.push("/dashboard/admin");
      } else if (role === "SHOP_OWNER") {
        router.push("/dashboard/shopowner");
      } else if (role === "DELIVERY") {
        router.push("/dashboard/delivery");
      } else {
        router.push("/dashboard/farmer");
      }
    }
  }, [status, session, router]);

  return (
    <div className={styles.container} style={{ alignItems: 'center', justifyContent: 'center', minHeight: '100vh', background: '#f8fafc' }}>
      <div style={{ textAlign: 'center' }}>
        <div className="animate-spin" style={{ width: '50px', height: '50px', border: '5px solid #2563eb', borderTopColor: 'transparent', borderRadius: '50%', margin: '0 auto 1.5rem' }}></div>
        <h3 style={{ color: '#1e293b', fontWeight: 800, fontSize: '1.25rem' }}>Verifying Credentials...</h3>
        <p style={{ color: '#64748b', marginTop: '0.25rem' }}>Directing you to your workspace</p>
      </div>
    </div>
  );
}
