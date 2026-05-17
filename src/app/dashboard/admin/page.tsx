"use client";

import { useState, useEffect } from "react";
import { 
  Users, Package, TrendingUp, DollarSign, Gavel, Truck, 
  Activity, Search, Filter, ArrowUpRight, ArrowDownRight,
  Leaf, ShoppingBag, MapPin, Calendar, Clock, BarChart2
} from "lucide-react";
import styles from "./page.module.css";
import { prisma } from "@/lib/prisma"; // This will need to be fetched via action

// We will use a server action to fetch all these metrics in one go
import { getAdminMetrics } from "@/app/actions/adminActions";

export default function AdminDashboard() {
  const [metrics, setMetrics] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  async function loadMetrics() {
    setLoading(true);
    const data = await getAdminMetrics();
    setMetrics(data);
    setLoading(false);
  }

  useEffect(() => { loadMetrics(); }, []);

  if (loading) return (
    <div className={styles.container} style={{ alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ textAlign: 'center' }}>
        <div className="animate-spin" style={{ width: '50px', height: '50px', border: '5px solid #6366f1', borderTopColor: 'transparent', borderRadius: '50%', margin: '0 auto 2rem' }}></div>
        <h2 style={{ fontWeight: 800, color: '#1e293b' }}>Aggregating Global Metrics...</h2>
      </div>
    </div>
  );

  return (
    <div className={styles.container}>
      {/* SIDEBAR */}
      <aside className={styles.sidebar}>
        <div className={styles.logoArea}><div className={styles.logoIcon}><Activity size={24} /></div><span className={styles.logoText}>AgriAdmin</span></div>
        <nav className={styles.navMenu}>
          <button className={`${styles.navItem} ${styles.active}`}><LayoutDashboard size={22} /> Main Hub</button>
          <button className={styles.navItem}><Users size={22} /> User Registry</button>
          <button className={styles.navItem}><Package size={22} /> Global Inventory</button>
          <button className={styles.navItem}><Gavel size={22} /> Deal Monitor</button>
          <button className={styles.navItem}><Truck size={22} /> Logistics</button>
          <button className={styles.navItem}><BarChart2 size={22} /> System Health</button>
        </nav>
      </aside>

      {/* MAIN CONTENT */}
      <main className={styles.mainContent}>
        <header className={styles.header}>
           <div><h1 style={{ margin: 0, fontSize: '2.5rem', fontWeight: 800, letterSpacing: '-0.03em' }}>Operations Control</h1><p style={{ color: '#64748b', marginTop: '0.25rem' }}>Real-time oversight of the Agri Marketplace ecosystem.</p></div>
           <div className={styles.adminBadge}><div className={styles.avatar}>AD</div><div><h4 style={{ margin: 0 }}>System Root</h4><p style={{ margin: 0, fontSize: '0.8rem', color: '#6366f1' }}>Full Access</p></div></div>
        </header>

        {/* TOP STATS GRID */}
        <div className={styles.statsGrid}>
           <div className={styles.adminStatCard}>
              <div className={styles.statIcon} style={{ background: '#e0e7ff', color: '#4338ca' }}><Users size={24} /></div>
              <div><p className={styles.statLabel}>Total Participants</p><h3 className={styles.statValue}>{metrics.totalParticipants}</h3></div>
              <div className={styles.trend}><ArrowUpRight size={16} /> 12%</div>
           </div>
           <div className={styles.adminStatCard}>
              <div className={styles.statIcon} style={{ background: '#ecfdf5', color: '#059669' }}><Package size={24} /></div>
              <div><p className={styles.statLabel}>Active Harvests</p><h3 className={styles.statValue}>{metrics.totalHarvests}</h3></div>
              <div className={styles.trend}><ArrowUpRight size={16} /> 8%</div>
           </div>
           <div className={styles.adminStatCard}>
              <div className={styles.statIcon} style={{ background: '#fef3c7', color: '#d97706' }}><Gavel size={24} /></div>
              <div><p className={styles.statLabel}>Total Deals</p><h3 className={styles.statValue}>{metrics.totalDeals}</h3></div>
              <div className={styles.trend}><ArrowUpRight size={16} /> 24%</div>
           </div>
           <div className={styles.adminStatCard}>
              <div className={styles.statIcon} style={{ background: '#fff1f2', color: '#e11d48' }}><DollarSign size={24} /></div>
              <div><p className={styles.statLabel}>Market Volume</p><h3 className={styles.statValue}>₹{(metrics.totalVolume / 1000).toFixed(1)}K</h3></div>
              <div className={styles.trend}><ArrowUpRight size={16} /> 15%</div>
           </div>
        </div>

        {/* SECONDARY GRID: ACTIVITY & CHARTS */}
        <div className={styles.dashboardGrid}>
           <section className={styles.card} style={{ flex: 2 }}>
              <div className={styles.cardHeader}><h2>Real-Time Activity Stream</h2><button className={styles.refreshBtn} onClick={loadMetrics}><RefreshCw size={18} /></button></div>
              <div className={styles.activityList}>
                 {metrics.recentActivity.map((act: any, i: number) => (
                    <div key={i} className={styles.activityItem}>
                       <div className={styles.activityDot} style={{ background: act.status === 'ACCEPTED' ? '#10b981' : '#6366f1' }} />
                       <div style={{ flex: 1 }}>
                          <p><strong>{act.buyer?.name}</strong> negotiated <strong>{act.product?.name}</strong> for <strong>₹{act.offeredPrice}</strong></p>
                          <span style={{ fontSize: '0.8rem', color: '#94a3b8' }}>{new Date(act.updatedAt).toLocaleTimeString()}</span>
                       </div>
                       <span className={styles.statusBadge}>{act.status}</span>
                    </div>
                 ))}
              </div>
           </section>

           <section className={styles.card} style={{ flex: 1 }}>
              <div className={styles.cardHeader}><h2>Distribution</h2></div>
              <div className={styles.roleDistribution}>
                 <div className={styles.distRow}><span className={styles.distLabel}>Farmers</span><div className={styles.progressBar}><div className={styles.progressFill} style={{ width: `${(metrics.farmers / metrics.totalParticipants) * 100}%`, background: '#10b981' }} /></div><span>{metrics.farmers}</span></div>
                 <div className={styles.distRow}><span className={styles.distLabel}>Shop Owners</span><div className={styles.progressBar}><div className={styles.progressFill} style={{ width: `${(metrics.shopOwners / metrics.totalParticipants) * 100}%`, background: '#2563eb' }} /></div><span>{metrics.shopOwners}</span></div>
                 <div className={styles.distRow}><span className={styles.distLabel}>Agents</span><div className={styles.progressBar}><div className={styles.progressFill} style={{ width: `${(metrics.agents / metrics.totalParticipants) * 100}%`, background: '#f59e0b' }} /></div><span>{metrics.agents}</span></div>
              </div>
           </section>
        </div>
      </main>
    </div>
  );
}

function LayoutDashboard({ size }: { size: number }) { return <LayoutDashboard size={size} />; }
function RefreshCw({ size }: { size: number }) { return <RefreshCw size={size} />; }
